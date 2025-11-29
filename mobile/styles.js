import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050816",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 16,
    backgroundColor: "#050816",
  },
  splashContainer: {
    flex: 1,
    backgroundColor: "#050816",
    alignItems: "center",
    justifyContent: "center",
  },
  splashLogoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2A5FFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A5FFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  logoText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  title: {
    color: "#F9FAFB",
    fontSize: 20,
    fontWeight: "600",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  splashTitle: {
    color: "#F9FAFB",
    fontSize: 24,
    fontWeight: "700",
  },
  splashSubtitle: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 16,
  },
  splashDotsRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  splashDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4B5563",
    marginHorizontal: 3,
  },
  sectionTitle: {
    color: "#E5E7EB",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitleAccent: {
    color: "#22CC88",
    fontSize: 14,
    fontWeight: "600",
  },
  sectionDescription: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 12,
  },
  secondaryLink: {
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  secondaryLinkText: {
    color: "#60A5FA",
    fontSize: 13,
  },
  scanButton: {
    backgroundColor: "#2A5FFF",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  scanButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  listHeaderTitle: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "500",
  },
  listHeaderCount: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  viewToggleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  viewToggleButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1F2937",
    paddingVertical: 6,
    alignItems: "center",
  },
  viewToggleButtonActive: {
    backgroundColor: "#1F2937",
    borderColor: "#2A5FFF",
  },
  viewToggleText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  viewToggleTextActive: {
    color: "#E5E7EB",
    fontWeight: "500",
  },
  invoicesHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  invoicesHeaderTitle: {
    color: "#E5E7EB",
    fontSize: 16,
    fontWeight: "600",
  },
  backText: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  detailCard: {
    backgroundColor: "#0B1220",
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  detailHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 8,
  },
  detailHint: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 4,
  },
  invoiceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0B1220",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  invoiceSupplier: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "500",
  },
  invoiceMeta: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 2,
  },
  invoiceAmount: {
    color: "#22CC88",
    fontSize: 14,
    fontWeight: "600",
  },
  originBadge: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
    fontSize: 10,
    overflow: "hidden",
  },
  originBadgeEmail: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    color: "#6EE7B7",
  },
  originBadgeMobile: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    color: "#7DD3FC",
  },
  originBadgeWeb: {
    backgroundColor: "rgba(129, 140, 248, 0.15)",
    color: "#A5B4FC",
  },
});
