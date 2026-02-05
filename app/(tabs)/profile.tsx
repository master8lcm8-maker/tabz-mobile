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
} from "react-native";
import { useRouter } from "expo-router";

import {
  apiGet,
  hydrateAuthToken,
  clearAuthToken,
  getBaseUrl,
  getAuthToken,
} from "../../components/lib/api";

// ✅ Local fallback assets (MUST exist at these paths)
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
  // ✅ Treat ONLY explicit 1x1 as invalid.
  // On web, width/height can be undefined even for valid images.
  return w === 1 && h === 1;
}

export default function MyProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Validity gates (used to decide fallback vs remote)
  const [avatarValid, setAvatarValid] = useState(false);
  const [coverValid, setCoverValid] = useState(false);

  // Cache-bust nonce: bump only on load/upload (not every render)
  const [imgNonce, setImgNonce] = useState(0);

  const initials = useMemo(
    () => getInitials(profile?.displayName),
    [profile?.displayName]
  );

  const loadProfile = useCallback(async () => {
    await hydrateAuthToken();
    const res: any = await apiGet("/profiles/me");
    const p = (res?.profile ?? null) as Profile | null;

    setProfile(p);
    setErrorMsg(null);

    // Start optimistic when URLs exist; onLoad/onError will correct it.
    setAvatarValid(!!p?.avatarUrl);
    setCoverValid(!!p?.coverUrl);

    // Bust cache once when profile loads/refreshes
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

        // open file picker
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/png,image/jpeg,image/webp";
        input.click();

        const file: File | null = await new Promise((resolve) => {
          input.onchange = () => resolve(input.files?.[0] ?? null);
        });

        if (!file) return;

        const fd = new FormData();
        fd.append("file", file); // MUST be field name "file"

        const base = getBaseUrl();
        const url = `${base}/profiles/me/${kind}`;

        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // DO NOT set Content-Type here (browser sets boundary)
          },
          body: fd,
        });

        let data: any = null;
        try {
          data = await res.json();
        } catch {}

        if (!res.ok) {
          throw new Error(
            `UPLOAD_${kind.toUpperCase()} failed: ${res.status} - ${JSON.stringify(
              data
            )}`
          );
        }

        // Refresh profile so new URLs are pulled
        await loadProfile();

        // Extra bump guarantees remount even if URL string repeats
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

        const msg = String(err?.message || err || "");

        if (msg.includes("AUTH_MISSING_WEB")) {
          setProfile(null);
          setErrorMsg("Not logged in. Please log in.");
          return;
        }

        if (msg.includes(" failed: 401")) {
          await clearAuthToken();
          setProfile(null);
          setErrorMsg("Session expired or invalid token. Please log in again.");
          return;
        }

        setProfile(null);
        setErrorMsg("Failed to load profile.");
        console.error("[profile] load failed", err);
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

        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.btnText}>Go to Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => {
            setLoading(true);
            loadProfile()
              .catch(() => {})
              .finally(() => setLoading(false));
          }}
        >
          <Text style={styles.btnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const debugLine = `type: ${profile.type} • avatarUrl: ${
    profile.avatarUrl ? "yes" : "no"
  } • coverUrl: ${profile.coverUrl ? "yes" : "no"} • platform: ${Platform.OS}`;

  // Cache-bust only when imgNonce changes
  const avatarUri =
    profile.avatarUrl && avatarValid
      ? `${profile.avatarUrl}${
          profile.avatarUrl.includes("?") ? "&" : "?"
        }v=${imgNonce}`
      : null;

  const coverUri =
    profile.coverUrl && coverValid
      ? `${profile.coverUrl}${
          profile.coverUrl.includes("?") ? "&" : "?"
        }v=${imgNonce}`
      : null;

  const coverSource = coverUri ? { uri: coverUri } : FALLBACK_COVER;
  const avatarSource = avatarUri ? { uri: avatarUri } : FALLBACK_AVATAR;

  return (
    <ScrollView style={styles.container}>
      {/* Cover */}
      <View style={styles.coverWrap}>
        <Image
          key={`${coverUri || "fallback-cover"}|${coverValid}|${imgNonce}`}
          source={coverSource}
          style={styles.cover}
          resizeMode="cover"
          onLoad={(e: any) => {
            if (!profile.coverUrl) return;
            const w = e?.nativeEvent?.source?.width;
            const h = e?.nativeEvent?.source?.height;
            // If width/height missing, treat as valid (not tiny)
            setCoverValid(!isTinyImage(w, h));
          }}
          onError={() => setCoverValid(false)}
        />
      </View>

      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatarOuter}>
          <Image
            key={`${avatarUri || "fallback-avatar"}|${avatarValid}|${imgNonce}`}
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
        <Text style={styles.debug}>{debugLine}</Text>

        {/* web-only upload buttons */}
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

        {errorMsg ? (
          <Text style={{ marginTop: 10, fontSize: 12, color: "#b91c1c" }}>
            {errorMsg}
          </Text>
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },

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
    backgroundColor: "transparent",
  },
  initials: { color: "#111827", fontSize: 18, fontWeight: "900" },

  info: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  name: { fontSize: 20, fontWeight: "600" },
  debug: { marginTop: 6, fontSize: 12, color: "#6b7280" },

  bio: { marginTop: 10, fontSize: 14, color: "#333" },
  bioMuted: {
    marginTop: 10,
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },

  mutedTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  mutedText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
    textAlign: "center",
  },

  btnSmall: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#111827",
    alignItems: "center",
  },

  btn: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: "#111827",
    alignItems: "center",
    marginTop: 10,
  },
  btnSecondary: { backgroundColor: "#374151" },
  btnText: { color: "#fff", fontWeight: "800" },
});
