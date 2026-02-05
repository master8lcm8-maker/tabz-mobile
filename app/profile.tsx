// ===============================================
//  FILE: app/profile.tsx
//  Phase 2.1 — Profile v1 (LIVE DATA)
// ===============================================

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { apiGet, hydrateSession } from "../components/lib/api";

type MeResponse = {
  ok?: boolean;
  userId?: number;
  profileId?: number;
  profile?: {
    displayName?: string;
    slug?: string;
    type?: string;
    bio?: string | null;
    links?: string[] | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    [k: string]: any;
  };
  profileExt?: {
    displayName?: string;
    slug?: string;
    type?: string;
    bio?: string | null;
    links?: string[] | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    [k: string]: any;
  };
  [k: string]: any;
};

export default function ProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // Ensure BASE_URL + token hydrated
        await hydrateSession();

        // Fetch profile
        const data = (await apiGet("/profiles/me")) as MeResponse;

        if (!alive) return;
        setMe(data);
      } catch (e: any) {
        if (!alive) return;
        setErr(String(e?.message || e));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const profile = useMemo(() => {
    const p = me?.profile ?? me?.profileExt ?? {};
    const displayName = String(p.displayName || "TBD Username");
    const username = p.slug ? `@${String(p.slug)}` : "@tbd";
    const bio = p.bio ? String(p.bio) : "No bio yet";
    const links = Array.isArray(p.links) ? p.links.filter(Boolean) : [];
    const avatarUrl =
      typeof p.avatarUrl === "string" && p.avatarUrl.trim().length > 0
        ? p.avatarUrl.trim()
        : null;

    return { displayName, username, bio, links, avatarUrl };
  }, [me]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profile</Text>

      <View style={styles.card}>
        {/* AVATAR */}
        <View style={styles.avatarWrap}>
          {profile.avatarUrl ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={styles.avatarImg}
              onError={() => {
                // If the URL 404s etc, we still show the ring but no crash
                // (Network->Img will show the failing request)
              }}
            />
          ) : (
            <View style={styles.avatarFallback} />
          )}
        </View>

        <Text style={styles.displayName}>{profile.displayName}</Text>
        <Text style={styles.username}>{profile.username}</Text>

        {loading ? (
          <View style={{ marginTop: 10 }}>
            <ActivityIndicator />
            <Text style={[styles.bodyText, { marginTop: 8 }]}>Loading…</Text>
          </View>
        ) : err ? (
          <View style={{ marginTop: 10 }}>
            <Text style={[styles.bodyText, { color: "#ff6b6b" }]}>
              {err}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Bio</Text>
            <Text style={styles.bodyText}>{profile.bio}</Text>

            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>Links</Text>
            {profile.links.length === 0 ? (
              <Text style={styles.bodyText}>None</Text>
            ) : (
              profile.links.map((url, idx) => (
                <Text key={idx} style={styles.linkText}>
                  {url}
                </Text>
              ))
            )}
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      >
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0F",
    padding: 16,
    paddingTop: 18,
  },
  header: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 12,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    backgroundColor: "#0f1628",
    borderWidth: 1,
    borderColor: "#1f2a44",
  },

  // Avatar ring wrapper (keeps your neon ring)
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderColor: "#00FFD1",
    borderWidth: 2,
    alignSelf: "center",
    marginBottom: 12,
    overflow: "hidden",
    backgroundColor: "#111827",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#111827",
  },

  displayName: {
    color: "#EAF2FF",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  username: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  sectionLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 6,
  },
  bodyText: {
    color: "#C7D2FE",
    fontSize: 14,
    fontWeight: "700",
  },
  linkText: {
    color: "#1E90FF",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
  },
  backBtn: {
    marginTop: 14,
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: "#00FFD1",
    alignItems: "center",
  },
  backBtnText: {
    color: "#0A0E15",
    fontSize: 15,
    fontWeight: "900",
  },
});
