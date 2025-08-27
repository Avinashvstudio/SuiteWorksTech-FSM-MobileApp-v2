import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from "react-native";
import React, { useState } from "react";
import { useEquipmentUsageLog } from "@/hooks/useEquipmentUsageLog";
import { StatusBar } from "expo-status-bar";
import { Colors } from "@/common/styles";
import { Entypo, Ionicons, MaterialIcons } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import { useRoute, useNavigation } from "@react-navigation/native";
import { router } from "expo-router";

const ViewEquipUsage = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const equipLog = route.params?.item || {};

  const [primaryInfoExpanded, setPrimaryInfoExpanded] = useState(true);
  const [classificationExpanded, setClassificationExpanded] = useState(true);
  const [maintenanceJobOrderExpanded, setMaintenanceJobOrderExpanded] =
    useState(true);
  const [usageSettingsExpanded, setUsageSettingsExpanded] = useState(true);
  const [maintenanceJobScheduleExpanded, setMaintenanceJobScheduleExpanded] =
    useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const openItemModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const sampleItem = {
    item: "Maintenance charges",
    quantity: 1,
    description: "",
    usageDate: "04/17/2025",
    utilizedUnits: 250,
    totalOperatingUnits: 250,
    lastMaintenanceUnits: 0,
    difference: 250,
    maintenanceAction: "Perform maintenance",
    amount: "0.00",
  };

  const documentNumber = equipLog["Document Number"] || "18";

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Equipment Usage Log</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logUsageButton}
            onPress={() => router.push("/(drawer)/equipmentUsageLog")}
          >
            <Text style={styles.logUsageButtonText}>Log Usage</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setPrimaryInfoExpanded(!primaryInfoExpanded)}
        >
          <MaterialIcons
            name={
              primaryInfoExpanded
                ? "keyboard-arrow-down"
                : "keyboard-arrow-right"
            }
            size={24}
            color="white"
          />
          <Text style={styles.sectionHeaderText}>Primary Information</Text>
        </TouchableOpacity>

        {primaryInfoExpanded && (
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>DOCUMENT #</Text>
                <Text style={styles.infoValue}>{documentNumber}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>DATE</Text>
                <Text style={styles.infoValue}>
                  {equipLog.Date || "04/17/2025"}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>CUSTOMER</Text>
                <Text style={styles.infoValue}>
                  {equipLog.Name || "CUST03 PrecisionTime Co."}
                </Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setClassificationExpanded(!classificationExpanded)}
        >
          <MaterialIcons
            name={
              classificationExpanded
                ? "keyboard-arrow-down"
                : "keyboard-arrow-right"
            }
            size={24}
            color="white"
          />
          <Text style={styles.sectionHeaderText}>Classification</Text>
        </TouchableOpacity>

        {classificationExpanded && (
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>DEPARTMENT</Text>
                <Text style={styles.infoValue}>
                  {equipLog.Department || ""}
                </Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>LOCATION</Text>
                <Text style={styles.infoValue}>
                  {equipLog.Location || "US Warehouse"}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>CLASS</Text>
                <Text style={styles.infoValue}>{equipLog.Class || ""}</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() =>
            setMaintenanceJobOrderExpanded(!maintenanceJobOrderExpanded)
          }
        >
          <MaterialIcons
            name={
              maintenanceJobOrderExpanded
                ? "keyboard-arrow-down"
                : "keyboard-arrow-right"
            }
            size={24}
            color="white"
          />
          <Text style={styles.sectionHeaderText}>
            Equipment Maintenance Job Order
          </Text>
        </TouchableOpacity>

        {maintenanceJobOrderExpanded && (
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>OPPORTUNITY</Text>
                <Text style={styles.infoValue}></Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>
                  EQUIPMENT MAINTENANCE JOB ORDER #
                </Text>
                <Text style={styles.infoValue}>
                  {equipLog["Equipment Maintenance Job Order #"]
                    ? `Equip Maintenance Job Order #${equipLog["Equipment Maintenance Job Order #"]}`
                    : "Equip Maintenance Job Order #EQJOB62"}
                </Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setUsageSettingsExpanded(!usageSettingsExpanded)}
        >
          <MaterialIcons
            name={
              usageSettingsExpanded
                ? "keyboard-arrow-down"
                : "keyboard-arrow-right"
            }
            size={24}
            color="white"
          />
          <Text style={styles.sectionHeaderText}>Usage Settings</Text>
        </TouchableOpacity>

        {usageSettingsExpanded && (
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>EQUIPMENT</Text>
                <Text style={styles.infoValue}>
                  {equipLog.Equipment || "Watch - Model 12X00A"}
                </Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>
                  MAINTENANCE THRESHOLD (IN USAGE UNITS)
                </Text>
                <Text style={styles.infoValue}>
                  {equipLog["Maintenance Threshold (In Usage Units)"] || "200"}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>USAGE UNITS</Text>
                <Text style={styles.infoValue}>
                  {equipLog["Usage Units"] || "KM"}
                </Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>
                  MAINTENANCE COVERAGE LIMIT (IN USAGE UNITS)
                </Text>
                <Text style={styles.infoValue}>
                  {equipLog["Maintenance Coverage Limit (In Usage Units)"] ||
                    "500"}
                </Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() =>
            setMaintenanceJobScheduleExpanded(!maintenanceJobScheduleExpanded)
          }
        >
          <MaterialIcons
            name={
              maintenanceJobScheduleExpanded
                ? "keyboard-arrow-down"
                : "keyboard-arrow-right"
            }
            size={24}
            color="white"
          />
          <Text style={styles.sectionHeaderText}>Maintenance Job Schedule</Text>
        </TouchableOpacity>

        {maintenanceJobScheduleExpanded && (
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>MAINTENANCE JOB SCHEDULE</Text>
                <Text style={styles.infoValue}>
                  {equipLog["Maintenance Job Schedule"] ||
                    "Maintenance Job Schedule #119"}
                </Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>MAINTENANCE START DATE</Text>
                <Text style={styles.infoValue}>
                  {equipLog["Maintenance Start Date"] || "01/01/2025"}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.checkboxRow}>
                <Checkbox
                  value={equipLog["Last Maintenance"] === true}
                  color={
                    equipLog["Last Maintenance"] === true
                      ? Colors.primary
                      : undefined
                  }
                  style={styles.checkbox}
                />
                <Text style={styles.checkboxLabel}>LAST MAINTENANCE</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>MAINTENANCE END DATE</Text>
                <Text style={styles.infoValue}>
                  {equipLog["Maintenance End Date"] || "03/31/2025"}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.checkboxRow}>
                <Checkbox
                  value={equipLog["Maintenance Completed"] === true}
                  color={
                    equipLog["Maintenance Completed"] === true
                      ? Colors.primary
                      : undefined
                  }
                  style={styles.checkbox}
                />
                <Text style={styles.checkboxLabel}>MAINTENANCE COMPLETED</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.tabsContainer}>
          <TouchableOpacity style={styles.activeTab}>
            <Text style={styles.activeTabText}>Enter Actual Usage</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.itemsHeaderContainer}>
          <Text style={styles.itemsHeader}>Items 0.00</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>ITEM</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>USAGE DATE</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>AMOUNT</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>View</Text>
        </View>

        <TouchableOpacity
          style={styles.tableRow}
          onPress={() => openItemModal(sampleItem)}
        >
          <Text style={[styles.tableCell, { flex: 2 }]}>{sampleItem.item}</Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>
            {sampleItem.usageDate}
          </Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>
            {sampleItem.amount}
          </Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>
            <Entypo name="eye" size={24} color={Colors.primary} />
          </Text>
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Item Details</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {selectedItem && (
                <ScrollView style={styles.modalScrollView}>
                  <View style={styles.modalInfoSection}>
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>ITEM</Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedItem.item}
                      </Text>
                    </View>

                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>QUANTITY</Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedItem.quantity}
                      </Text>
                    </View>

                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>DESCRIPTION</Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedItem.description || "-"}
                      </Text>
                    </View>

                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>USAGE DATE</Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedItem.usageDate}
                      </Text>
                    </View>

                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>
                        ENTER UTILIZED UNITS
                      </Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedItem.utilizedUnits}
                      </Text>
                    </View>

                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>
                        TOTAL OPERATING UNITS
                      </Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedItem.totalOperatingUnits}
                      </Text>
                    </View>

                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>
                        LAST MAINTENANCE UNITS
                      </Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedItem.lastMaintenanceUnits}
                      </Text>
                    </View>

                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>
                        DIFFERENCE (TOTAL - LAST)
                      </Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedItem.difference}
                      </Text>
                    </View>

                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>
                        MAINTENANCE ACTION
                      </Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedItem.maintenanceAction}
                      </Text>
                    </View>

                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>AMOUNT</Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedItem.amount}
                      </Text>
                    </View>
                  </View>
                </ScrollView>
              )}

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>

                {/* <TouchableOpacity style={styles.modalPrimaryButton}>
                  <Text style={styles.modalPrimaryButtonText}>Edit</Text>
                </TouchableOpacity> */}
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerContainer: {
    backgroundColor: Colors.primary,
    padding: 22,
    paddingTop: 35,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  scrollView: {
    flex: 1,
    padding: 9,
  },
  idContainer: {
    backgroundColor: "white",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  idText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  customerText: {
    fontSize: 16,
    marginTop: 5,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  editButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 4,
    marginRight: 10,
  },
  editButtonText: {
    color: "white",
    fontWeight: "500",
  },
  backButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 4,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  backButtonText: {
    color: "#333",
  },
  logUsageButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 4,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  logUsageButtonText: {
    color: "#333",
  },
  actionButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    marginRight: 10,
    backgroundColor: "#f0f0f0",
  },
  actionsButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  actionsButtonText: {
    color: "#333",
  },
  sectionHeader: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginTop: 10,
  },
  sectionHeaderText: {
    color: "white",
    fontWeight: "500",
    fontSize: 16,
  },
  sectionContent: {
    backgroundColor: "white",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 14,
  },
  checkboxRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    marginRight: 10,
  },
  checkboxLabel: {
    color: "#888",
    fontSize: 12,
  },

  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#e0e0e0",
    marginTop: 20,
  },
  activeTab: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#ccc",
    marginBottom: -1,
  },
  activeTabText: {
    fontWeight: "500",
  },
  inactiveTab: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  inactiveTabText: {
    color: "#333",
  },
  itemsHeaderContainer: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  itemsHeader: {
    fontWeight: "500",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
    paddingHorizontal: 5,
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 15,
  },
  tableCell: {
    fontSize: 14,
    paddingHorizontal: 5,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 500,
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: Colors.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  modalScrollView: {
    maxHeight: 450,
  },
  modalInfoSection: {
    padding: 15,
  },
  modalInfoRow: {
    marginBottom: 15,
  },
  modalInfoLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 5,
    fontWeight: "500",
  },
  modalInfoValue: {
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
    marginLeft: 10,
  },
  modalButtonText: {
    color: "#333",
  },
  modalPrimaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 4,
    marginLeft: 10,
  },
  modalPrimaryButtonText: {
    color: "white",
    fontWeight: "500",
  },
});

export default ViewEquipUsage;
