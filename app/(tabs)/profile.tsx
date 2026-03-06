// app/(tabs)/profile.tsx
// Robust: use avatarValid/coverValid to decide fallback vs remote,
// cache-bust on load/upload, and force remount when validity flips.
// Pillar 5 frontend surface added: Danger Zone / Account Deletion UI.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Pressable,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";

import {
  apiGet,
  apiPost,
  hydrateAuthToken,
  clearAuthToken,
  getBaseUrl,
  getAuthToken,
} from "../../components/lib/api";

// Local fallback assets (MUST exist)
const FALLBACK_AVATAR = require("../../assets/images/tabz-avatar.png");
const FALLBACK_COVER = require("../../assets/images/tabz-cover.png");

type Profile = {
  id: number;
  type: "buyer" | "owner";
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
};

function getInitials(name: string | null | undefined) {
  const s = String(name || "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase();
}

function isTinyImage(w?: number, h?: number) {
  return w === 1 && h === 1;
}

export default function MyProfileScreen() {
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await clearAuthToken();
    router.replace("/login");
  }, [router]);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [avatarValid, setAvatarValid] = useState(false);
  const [coverValid, setCoverValid] = useState(false);
  const [imgNonce, setImgNonce] = useState(0);

  const [showDangerZone, setShowDangerZone] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [deletionPassword, setDeletionPassword] = useState("");
  const [deletionMessage, setDeletionMessage] = useState<string | null>(null);
  const [deletionBusy, setDeletionBusy] = useState(false);
  const [requestCreated, setRequestCreated] = useState(false);

  const initials = useMemo(
    () => getInitials(profile?.displayName),
    [profile?.displayName]
  );

  const loadProfile = useCallback(async () => {
    await hydrateAuthToken();

    const res: any = await apiGet("/profiles/me");

    // 🔥 BULLETPROOF EXTRACTION
    let p: Profile | null = null;

    if (res?.profile) p = res.profile;
    else if (Array.isArray(res?.profiles) && res.profiles.length > 0)
      p = res.profiles[0];
    else if (res?.profileId && Array.isArray(res?.profiles)) {
      p = res.profiles.find((x: any) => x.id === res.profileId) ?? null;
    }

    if (!p) {
      throw new Error("PROFILE_MISSING_IN_RESPONSE");
    }

    setProfile(p);
    setErrorMsg(null);

    setAvatarValid(!!p.avatarUrl);
    setCoverValid(!!p.coverUrl);
    setImgNonce((n) => n + 1);
  }, []);

  // WEB upload (avatar/cover)
  const pickAndUpload = useCallback(
    async (kind: "avatar" | "cover") => {
      if (Platform.OS !== "web") {
        setErrorMsg("Upload buttons are web-only right now.");
        return;
      }

      try {
        await hydrateAuthToken();

        const token = getAuthToken();
        if (!token) {
          setErrorMsg("Not logged in (missing token).");
          return;
        }

        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/png,image/jpeg,image/webp";
        input.click();

        const file: File | null = await new Promise((resolve) => {
          input.onchange = () => resolve(input.files?.[0] ?? null);
        });

        if (!file) return;

        const fd = new FormData();
        fd.append("file", file);

        const base = getBaseUrl();
        const url = `${base}/profiles/me/${kind}`;

        const res = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });

        if (!res.ok) throw new Error(`UPLOAD_${kind} failed`);

        await loadProfile();
        setImgNonce((n) => n + 1);
      } catch (e: any) {
        const msg = String(e?.message || e || "Upload failed");
        setErrorMsg(msg);
        console.error("[profile] upload failed", e);
      }
    },
    [loadProfile]
  );

  const requestDeletion = useCallback(async () => {
    setDeletionMessage(null);
    setDeletionBusy(true);

    try {
      const payload: any = {};
      const reason = deletionReason.trim();
      if (reason) payload.reason = reason;

      const res: any = await apiPost("/account-deletion/request", payload);

      setRequestCreated(true);
      setDeletionMessage(
        res?.alreadyPending
          ? "Deletion request already exists. Enter password below to confirm."
          : "Deletion request created. Enter password below to confirm."
      );
    } catch (e: any) {
      setDeletionMessage(String(e?.message || e || "Failed to request deletion."));
    } finally {
      setDeletionBusy(false);
    }
  }, [deletionReason]);

  const confirmDeletion = useCallback(async () => {
    setDeletionMessage(null);

    const password = deletionPassword.trim();
    if (!password) {
      setDeletionMessage("Password is required to confirm account deletion.");
      return;
    }

    setDeletionBusy(true);
    try {
      const payload: any = {
        confirm: true,
        password,
      };

      const reason = deletionReason.trim();
      if (reason) payload.reason = reason;

      await apiPost("/account-deletion/confirm", payload);

      setDeletionMessage("Account deletion completed. Logging out...");
      setTimeout(async () => {
        await clearAuthToken();
        router.replace("/login");
      }, 800);
    } catch (e: any) {
      setDeletionMessage(String(e?.message || e || "Failed to confirm deletion."));
    } finally {
      setDeletionBusy(false);
    }
  }, [deletionPassword, deletionReason, router]);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        await loadProfile();
      } catch (err: any) {
        if (!mounted) return;
        setProfile(null);
        setErrorMsg(String(err?.message || "Failed to load profile"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    boot();
    return () => {
      mounted = false;
    };
  }, [loadProfile]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.mutedTitle}>Profile not available</Text>
        {errorMsg ? <Text style={styles.mutedText}>{errorMsg}</Text> : null}
      </View>
    );
  }

  const avatarUri =
    profile.avatarUrl && avatarValid
      ? `${profile.avatarUrl}${profile.avatarUrl.includes("?") ? "&" : "?"}v=${imgNonce}`
      : null;

  const coverUri =
    profile.coverUrl && coverValid
      ? `${profile.coverUrl}${profile.coverUrl.includes("?") ? "&" : "?"}v=${imgNonce}`
      : null;

  const coverSource = coverUri ? { uri: coverUri } : FALLBACK_COVER;
  const avatarSource = avatarUri ? { uri: avatarUri } : FALLBACK_AVATAR;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.coverWrap}>
        <Image
          key={`${coverUri || "fallback-cover"}|${imgNonce}`}
          source={coverSource}
          style={styles.cover}
          resizeMode="cover"
          onLoad={(e: any) => {
            if (!profile.coverUrl) return;
            const w = e?.nativeEvent?.source?.width;
            const h = e?.nativeEvent?.source?.height;
            setCoverValid(!isTinyImage(w, h));
          }}
          onError={() => setCoverValid(false)}
        />
      </View>

      <View style={styles.avatarWrap}>
        <View style={styles.avatarOuter}>
          <Image
            key={`${avatarUri || "fallback-avatar"}|${imgNonce}`}
            source={avatarSource}
            style={styles.avatar}
            resizeMode="cover"
            onLoad={(e: any) => {
              if (!profile.avatarUrl) return;
              const w = e?.nativeEvent?.source?.width;
              const h = e?.nativeEvent?.source?.height;
              setAvatarValid(!isTinyImage(w, h));
            }}
            onError={() => setAvatarValid(false)}
          />
          {!profile.avatarUrl && (
            <View pointerEvents="none" style={styles.initialsOverlay}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{profile.displayName || "Unnamed User"}</Text>

        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>

        {Platform.OS === "web" ? (
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <TouchableOpacity
              style={styles.btnSmall}
              onPress={() => pickAndUpload("avatar")}
            >
              <Text style={styles.btnText}>Upload Avatar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnSmall}
              onPress={() => pickAndUpload("cover")}
            >
              <Text style={styles.btnText}>Upload Cover</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {profile.bio ? (
          <Text style={styles.bio}>{profile.bio}</Text>
        ) : (
          <Text style={styles.bioMuted}>No bio yet</Text>
        )}

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Text style={styles.dangerText}>
            Request permanent account deletion. This uses the locked Pillar 5 backend flow.
          </Text>

          <TouchableOpacity
            style={styles.dangerToggleBtn}
            onPress={() => {
              setShowDangerZone((v) => !v);
              setDeletionMessage(null);
            }}
          >
            <Text style={styles.dangerToggleText}>
              {showDangerZone ? "Hide Delete Account" : "Delete Account"}
            </Text>
          </TouchableOpacity>

          {showDangerZone ? (
            <View style={styles.dangerCard}>
              <Text style={styles.fieldLabel}>Reason (optional)</Text>
              <TextInput
                value={deletionReason}
                onChangeText={setDeletionReason}
                placeholder="Why are you deleting this account?"
                placeholderTextColor="#888"
                style={styles.input}
              />

              <TouchableOpacity
                style={styles.requestBtn}
                disabled={deletionBusy}
                onPress={requestDeletion}
              >
                <Text style={styles.requestBtnText}>
                  {deletionBusy ? "Working..." : "Request Account Deletion"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Password (required to confirm)</Text>
              <TextInput
                value={deletionPassword}
                onChangeText={setDeletionPassword}
                placeholder="Enter your password"
                placeholderTextColor="#888"
                secureTextEntry
                style={styles.input}
              />

              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  !requestCreated && styles.confirmBtnDisabled,
                ]}
                disabled={deletionBusy || !requestCreated}
                onPress={confirmDeletion}
              >
                <Text style={styles.confirmBtnText}>
                  {deletionBusy ? "Working..." : "Confirm Delete Account"}
                </Text>
              </TouchableOpacity>

              {deletionMessage ? (
                <Text style={styles.deletionMessage}>{deletionMessage}</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  coverWrap: { width: "100%", height: 180, backgroundColor: "#e5e5e5" },
  cover: { width: "100%", height: 180, backgroundColor: "#e5e5e5" },
  avatarWrap: { marginTop: -48, paddingHorizontal: 16 },
  avatarOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#dfe6f1",
    overflow: "hidden",
  },
  avatar: { width: 96, height: 96 },
  initialsOverlay: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { color: "#111827", fontSize: 18, fontWeight: "900" },
  info: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  name: { fontSize: 20, fontWeight: "600" },
  bio: { marginTop: 10, fontSize: 14, color: "#333" },
  bioMuted: { marginTop: 10, fontSize: 14, color: "#999", fontStyle: "italic" },
  mutedTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  mutedText: { fontSize: 12, color: "#666", marginBottom: 12 },
  btnSmall: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#111827",
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "800" },
  logoutBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#111",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  logoutText: { color: "#fff", fontWeight: "600" },

  dangerZone: {
    marginTop: 28,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#b91c1c",
  },
  dangerText: {
    marginTop: 8,
    fontSize: 13,
    color: "#7f1d1d",
  },
  dangerToggleBtn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#991b1b",
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  dangerToggleText: {
    color: "#fff",
    fontWeight: "800",
  },
  dangerCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7f1d1d",
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#fca5a5",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: "#111",
  },
  requestBtn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#dc2626",
    alignItems: "center",
  },
  requestBtnText: {
    color: "#fff",
    fontWeight: "800",
  },
  confirmBtn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#7f1d1d",
    alignItems: "center",
  },
  confirmBtnDisabled: {
    opacity: 0.45,
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "800",
  },
  deletionMessage: {
    marginTop: 12,
    fontSize: 13,
    color: "#7f1d1d",
  },
});