import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const API_BASE = "http://10.0.0.239:3000";

const OWNER_FALLBACK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoib3duZXIzQHRhYnouYXBwIiwiaWF0IjoxNzY1MzM0NjA5LCJleHAiOjE3NjU5Mzk0MDl9.4ZaCbBmY0nhuBm385JzY0J7DIFtG3WPgbcfc8TLmkS4";

type OwnerProfile = {
  email: string;
  venueName: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
};

type BankInfo = {
  bankName: string;
  last4: string;
  status: "verified" | "pending" | "missing";
};

type VerificationInfo = {
  status: "verified" | "pending" | "missing";
};

export default function OwnerBasicInfo() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [verification, setVerification] = useState<VerificationInfo | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // MODAL STATE – VENUE
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [venueNameInput, setVenueNameInput] = useState("");
  const [venueAddressInput, setVenueAddressInput] = useState("");
  const [savingVenue, setSavingVenue] = useState(false);
  const [venueError, setVenueError] = useState<string | null>(null);

  // MODAL STATE – BANK
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankNameInput, setBankNameInput] = useState("");
  const [bankLast4Input, setBankLast4Input] = useState("");
  const [savingBank, setSavingBank] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  const headers = {
    Authorization: `Bearer ${OWNER_FALLBACK_TOKEN}`,
  };

  // ======================================================
  // LOAD DATA
  // ======================================================
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const profileRes = await fetch(`${API_BASE}/owner/profile`, { headers });
      const profileJson = await profileRes.json();

      const bankRes = await fetch(`${API_BASE}/owner/bank`, { headers });
      const bankJson = await bankRes.json();

      const verRes = await fetch(`${API_BASE}/owner/verification`, { headers });
      const verJson = await verRes.json();

      setProfile(profileJson);
      setBankInfo(bankJson);
      setVerification(verJson);
    } catch (err) {
      console.log("LOAD ERROR:", err);
      setError("Error loading data.");
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // VERIFICATION
  // ======================================================
  const startVerification = async () => {
    try {
      await fetch(`${API_BASE}/owner/verification/start`, {
        method: "POST",
        headers,
      });
      await loadData();
    } catch (err) {
      console.log("START VERIFICATION ERROR:", err);
    }
  };

  // ======================================================
  // VENUE MODAL HANDLERS
  // ======================================================
  const openVenueModal = () => {
    if (profile) {
      setVenueNameInput(profile.venueName || "");
      setVenueAddressInput(profile.address || "");
    }
    setVenueError(null);
    setShowVenueModal(true);
  };

  const closeVenueModal = () => {
    if (savingVenue) return;
    setShowVenueModal(false);
    setVenueError(null);
  };

  const saveVenueInfo = async () => {
    if (!venueNameInput.trim()) {
      setVenueError("Venue name is required.");
      return;
    }

    try {
      setSavingVenue(true);
      setVenueError(null);

      const res = await fetch(`${API_BASE}/owner/profile/update`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          venueName: venueNameInput.trim(),
          address: venueAddressInput.trim(),
        }),
      });

      if (!res.ok) {
        let message = `Update failed (${res.status})`;
        try {
          const errJson = await res.json();
          if (errJson?.message) {
            message = Array.isArray(errJson.message)
              ? errJson.message.join(", ")
              : String(errJson.message);
          }
        } catch {
          // ignore JSON parse error
        }
        setVenueError(message);
        return;
      }

      await loadData();
      setShowVenueModal(false);
      setVenueError(null);
    } catch (err) {
      console.log("SAVE VENUE ERROR:", err);
      setVenueError("Could not update venue info. Try again.");
    } finally {
      setSavingVenue(false);
    }
  };

  // ======================================================
  // BANK MODAL HANDLERS
  // ======================================================
  const openBankModal = () => {
    if (bankInfo) {
      setBankNameInput(bankInfo.bankName || "");
      setBankLast4Input(bankInfo.last4 || "");
    } else {
      setBankNameInput("");
      setBankLast4Input("");
    }
    setBankError(null);
    setShowBankModal(true);
  };

  const closeBankModal = () => {
    if (savingBank) return;
    setShowBankModal(false);
    setBankError(null);
  };

  const saveBankInfo = async () => {
    if (!bankNameInput.trim()) {
      setBankError("Bank name is required.");
      return;
    }
    if (!bankLast4Input.trim() || bankLast4Input.trim().length !== 4) {
      setBankError("Enter the last 4 digits of your account.");
      return;
    }

    try {
      setSavingBank(true);
      setBankError(null);

      const res = await fetch(`${API_BASE}/owner/bank/update`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bankName: bankNameInput.trim(),
          last4: bankLast4Input.trim(),
        }),
      });

      if (!res.ok) {
        let message = `Bank update failed (${res.status})`;
        try {
          const errJson = await res.json();
          if (errJson?.message) {
            message = Array.isArray(errJson.message)
              ? errJson.message.join(", ")
              : String(errJson.message);
          }
        } catch {
          // ignore
        }
        setBankError(message);
        return;
      }

      await loadData();
      setShowBankModal(false);
      setBankError(null);
    } catch (err) {
      console.log("SAVE BANK ERROR:", err);
      setBankError("Could not update bank info. Try again.");
    } finally {
      setSavingBank(false);
    }
  };

  // ======================================================
  // EFFECT
  // ======================================================
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ======================================================
  // RENDER
  // ======================================================
  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#15FF7F" />
      </ThemedView>
    );
  }

  if (!profile) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>No profile found.</ThemedText>
      </ThemedView>
    );
  }

  const verificationColor =
    verification?.status === "verified"
      ? "#15FF7F"
      : verification?.status === "pending"
      ? "#FFC94A"
      : "#FF4F4F";

  const verificationLabel =
    verification?.status === "verified"
      ? "Verified"
      : verification?.status === "pending"
      ? "Pending"
      : "Verification required";

  const bankStatusColor =
    bankInfo?.status === "verified"
      ? "#15FF7F"
      : bankInfo?.status === "pending"
      ? "#FFC94A"
      : "#FF4F4F";

  return (
    <ThemedView style={styles.pageWrapper}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* HEADER */}
        <ThemedText type="title" style={{ marginBottom: 8 }}>
          Owner Basic Info
        </ThemedText>
        {error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : null}

        {/* VENUE */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Venue Information
          </ThemedText>
          <View style={styles.infoCard}>
            <ThemedText style={styles.label}>Venue Name</ThemedText>
            <ThemedText style={styles.valueText}>{profile.venueName}</ThemedText>

            <ThemedText style={styles.label}>Contact Email</ThemedText>
            <ThemedText style={styles.valueText}>
              {profile.contactEmail || profile.email}
            </ThemedText>

            <ThemedText style={styles.label}>Contact Phone</ThemedText>
            <ThemedText style={styles.valueText}>
              {profile.contactPhone || "Not set"}
            </ThemedText>

            <ThemedText style={styles.label}>Address</ThemedText>
            <ThemedText style={styles.valueText}>
              {profile.address || "Not added"}
            </ThemedText>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={openVenueModal}
            >
              <ThemedText style={styles.actionButtonText}>
                Update info
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* BANK */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Payout Bank Information
          </ThemedText>

          <View style={styles.infoCard}>
            <ThemedText style={styles.label}>Bank Name</ThemedText>
            <ThemedText style={styles.valueText}>
              {bankInfo?.bankName || "Not set"}
            </ThemedText>

            <ThemedText style={styles.label}>Last 4 Digits</ThemedText>
            <ThemedText style={styles.valueText}>
              {bankInfo?.last4 ? `**** ${bankInfo.last4}` : "Not available"}
            </ThemedText>

            <ThemedText style={styles.label}>Status</ThemedText>
            <ThemedText
              style={[styles.valueText, { color: bankStatusColor }]}
            >
              {bankInfo?.status || "missing"}
            </ThemedText>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={openBankModal}
            >
              <ThemedText style={styles.actionButtonText}>
                Update bank info
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* VERIFICATION */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Identity Verification
          </ThemedText>

          <View style={styles.infoCard}>
            <ThemedText style={styles.label}>Verification Status</ThemedText>
            <ThemedText
              style={[styles.valueText, { color: verificationColor }]}
            >
              {verificationLabel}
            </ThemedText>

            {verification?.status !== "verified" && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={startVerification}
              >
                <ThemedText style={styles.actionButtonText}>
                  Start verification
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* REFRESH */}
        <TouchableOpacity onPress={loadData} style={styles.refreshButton}>
          <ThemedText style={styles.refreshText}>Refresh info</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* VENUE MODAL */}
      {showVenueModal && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>Update venue info</ThemedText>
            <ThemedText style={styles.modalSubtitle}>
              Change your venue name and address.
            </ThemedText>

            <ThemedText style={styles.modalLabel}>Venue name</ThemedText>
            <TextInput
              style={styles.modalInput}
              value={venueNameInput}
              onChangeText={setVenueNameInput}
              placeholder="Venue name"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />

            <ThemedText style={styles.modalLabel}>Address</ThemedText>
            <TextInput
              style={styles.modalInput}
              value={venueAddressInput}
              onChangeText={setVenueAddressInput}
              placeholder="Street address"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />

            {venueError ? (
              <ThemedText style={styles.modalError}>{venueError}</ThemedText>
            ) : null}

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={closeVenueModal}
                disabled={savingVenue}
              >
                <ThemedText style={styles.modalButtonSecondaryText}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={saveVenueInfo}
                disabled={savingVenue}
              >
                {savingVenue ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <ThemedText style={styles.modalButtonPrimaryText}>
                    Save changes
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* BANK MODAL */}
      {showBankModal && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>Update bank info</ThemedText>
            <ThemedText style={styles.modalSubtitle}>
              This bank will be used for your TABZ cashouts.
            </ThemedText>

            <ThemedText style={styles.modalLabel}>Bank name</ThemedText>
            <TextInput
              style={styles.modalInput}
              value={bankNameInput}
              onChangeText={setBankNameInput}
              placeholder="Chase, Bank of America, etc."
              placeholderTextColor="rgba(255,255,255,0.4)"
            />

            <ThemedText style={styles.modalLabel}>Last 4 digits</ThemedText>
            <TextInput
              style={styles.modalInput}
              value={bankLast4Input}
              onChangeText={setBankLast4Input}
              placeholder="9012"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="number-pad"
              maxLength={4}
            />

            {bankError ? (
              <ThemedText style={styles.modalError}>{bankError}</ThemedText>
            ) : null}

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={closeBankModal}
                disabled={savingBank}
              >
                <ThemedText style={styles.modalButtonSecondaryText}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={saveBankInfo}
                disabled={savingBank}
              >
                {savingBank ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <ThemedText style={styles.modalButtonPrimaryText}>
                    Save bank info
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  pageWrapper: {
    flex: 1,
    backgroundColor: "#05060E",
  },
  page: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#05060E",
  },
  errorText: {
    color: "#FF4F4F",
    fontSize: 14,
    marginBottom: 12,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.7)",
  },
  infoCard: {
    backgroundColor: "#080A15",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 10,
  },
  label: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
  },
  valueText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  actionButton: {
    marginTop: 10,
    backgroundColor: "#00AFFF",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  refreshButton: {
    marginTop: 10,
    backgroundColor: "#15FF7F",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  refreshText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "700",
  },

  // MODAL
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: "#080A15",
    borderWidth: 1,
    borderColor: "#FFC94A",
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: "#FFC94A",
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 18,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  modalInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: "#05060E",
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 10,
  },
  modalButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  modalButtonSecondaryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  modalButtonPrimary: {
    backgroundColor: "#FFC94A",
  },
  modalButtonPrimaryText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "700",
  },
  modalError: {
    color: "#FF4F4F",
    fontSize: 12,
    marginTop: 4,
  },
});
