// app/(tabs)/profile.tsx
// Robust: use avatarValid/coverValid to decide fallback vs remote,
// cache-bust on load/upload, and force remount when validity flips.

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
} from "react-native";
import { useRouter } from "expo-router";

import {
  apiGet,
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
});
