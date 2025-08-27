import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Drawer } from "expo-router/drawer";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import {
  Feather,
  MaterialCommunityIcons,
  FontAwesome5,
  AntDesign,
  EvilIcons,
} from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Colors } from "@/common/styles";
import { useAuth } from "@/hooks/useAuth";
import { useJobStore } from "@/store/globalStore";
import { User } from "@/types";

interface SubMenuItem {
  label: string;
  route: string;
}

interface MenuItem {
  icon: string;
  iconProvider: any;
  label: string;
  route: string;
  hide?: boolean;
  subItems: SubMenuItem[];
}

// Tab data structure from login response
interface TabData {
  tabName: string;
  displayName: string;
  hide: boolean;
}



const _layout = () => {
  const { user } = useJobStore();

  console.log("layout", user);

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
          height: 80,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontFamily: "Roboto",
          fontWeight: "semibold",
          fontSize: 20,
        },
        // headerShown: true,
        drawerStyle: {
          width: "70%",
        },
      }}
    >
      <Drawer.Screen
        name="dashboard"
        options={{
          headerShown: true,
          title: "Dashboard",
        }}
      />

      <Drawer.Screen
        name="maintenanceJOList"
        options={{ headerShown: true, title: "Maintenance List" }}
      />
      <Drawer.Screen
        name="viewJO"
        options={{ headerShown: true, title: "View Job Order" }}
      />
      <Drawer.Screen
        name="CreateJO"
        options={{ headerShown: true, title: "Create Job Order" }}
      />
      <Drawer.Screen
        name="shipEquipment"
        options={{ headerShown: true, title: "Ship Equipment" }}
      />
      <Drawer.Screen
        name="jobScheduleList"
        options={{ headerShown: true, title: "Job Schedule List" }}
      />
      <Drawer.Screen
        name="pendingJobs"
        options={{ headerShown: true, title: "Pending Jobs" }}
      />
      <Drawer.Screen
        name="equipmentUsageLog"
        options={{ headerShown: false, title: "Equipment Usage Log" }}
      />
      <Drawer.Screen
        name="equipUsageLogList"
        options={{ headerShown: true, title: "Equipment Usage List" }}
      />
      <Drawer.Screen
        name="pendignEquipUsageLogList"
        options={{ headerShown: true, title: "Pending Equipment Usage" }}
      />
      <Drawer.Screen
        name="settings"
        options={{ headerShown: true, title: "Settings" }}
      />
    </Drawer>
  );
};

export default _layout;

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { user }: { user: any } = useJobStore();

  const pathname = usePathname();

  const [expandedMenus, setExpandedMenus] = useState<{
    [key: string]: boolean;
  }>({});

  // Dynamic menu items populated from login response
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Transform login response tab data to menu items
  const transformLoginTabsToMenu = (tabs: TabData[]) => {
    console.log('Processing tabs from server:', tabs);
    
    // First, add any missing tabs that should always be present
    const allTabs = [...tabs];
    
    // Check if Dashboard is missing and add it
    if (!tabs.find(tab => tab.tabName === 'Dashboard')) {
      allTabs.push({
        tabName: 'Dashboard',
        displayName: 'Dashboard',
        hide: false
      });
    }
    
    // Check if Settings is missing and add it
    if (!tabs.find(tab => tab.tabName === 'Settings')) {
      allTabs.push({
        tabName: 'Settings',
        displayName: 'Settings',
        hide: false
      });
    }
    
    // Define the correct order for menu items
    const correctOrder = [
      'Dashboard',
      'Job Order',
      'Ship Equipment', 
      'Job Schedules',
      'Pending Jobs',
      'Equipment Usage Log',
      'Settings'
    ];

    // Create a map of tab data by tab name for quick lookup
    const tabsMap = new Map(allTabs.map(tab => [tab.tabName, tab]));

    // Build menu items in the correct order
    const transformedMenuItems: MenuItem[] = correctOrder.map(tabName => {
      const tab = tabsMap.get(tabName);
      
      if (!tab) {
        console.warn(`Tab "${tabName}" not found in server response, using default`);
        // Return default item if tab not found in server response
        const defaultItem = getDefaultMenuItems().find(item => item.label === tabName);
        return defaultItem || {
          icon: 'circle',
          iconProvider: AntDesign,
          label: tabName,
          route: '/dashboard',
          hide: false,
          subItems: [],
        };
      }

      // Map tab names to icon and provider
      const iconMapping = {
        'Dashboard': { icon: 'dashboard', provider: AntDesign },
        'Job Order': { icon: 'tool', provider: Feather },
        'Ship Equipment': { icon: 'truck-delivery', provider: MaterialCommunityIcons },
        'Job Schedules': { icon: 'calendar-check', provider: FontAwesome5 },
        'Pending Jobs': { icon: 'clock-alert', provider: MaterialCommunityIcons },
        'Equipment Usage Log': { icon: 'clipboard-list', provider: MaterialCommunityIcons },
        'Settings': { icon: 'gear', provider: EvilIcons },
      };

      const iconInfo = iconMapping[tabName as keyof typeof iconMapping] || { icon: 'circle', provider: AntDesign };

      return {
        icon: iconInfo.icon,
        iconProvider: iconInfo.provider,
        label: tab.displayName,
        route: getRouteFromTabName(tabName),
        hide: tab.hide,
        subItems: getDefaultSubItems(tabName),
      };
    });

    console.log('All tabs after adding missing ones:', allTabs);
    console.log('Transformed menu items in correct order:', transformedMenuItems);
    return transformedMenuItems;
  };

  // Helper function to get route from tab name
  const getRouteFromTabName = (tabName: string): string => {
    const routeMapping: { [key: string]: string } = {
      'Dashboard': '/dashboard',
      'Job Order': '/maintenanceJOList',
      'Ship Equipment': '/shipEquipment',
      'Job Schedules': '/jobScheduleList',
      'Pending Jobs': '/pendingJobs',
      'Equipment Usage Log': '/equipmentUsageLog',
      'Settings': '/settings',
    };
    return routeMapping[tabName] || '/dashboard';
  };

  // Helper function to get default sub-items for tabs
  const getDefaultSubItems = (tabName: string): SubMenuItem[] => {
    const subItemsMapping: { [key: string]: SubMenuItem[] } = {
      'Job Order': [
        { label: "List", route: "/maintenanceJOList" },
        { label: "Create Job Order", route: "/CreateJO" }
      ],
      'Job Schedules': [
        { label: "List", route: "/jobScheduleList" }
      ],
      'Equipment Usage Log': [
        { label: "Equip Usage List", route: "/equipUsageLogList" },
        { label: "Pending Equip. Usage", route: "/pendignEquipUsageLogList" }
      ],
      'Dashboard': [],
      'Ship Equipment': [],
      'Pending Jobs': [],
      'Settings': []
    };
    return subItemsMapping[tabName] || [];
  };

  // Default menu items as fallback
  const getDefaultMenuItems = (): MenuItem[] => [
    {
      icon: "dashboard",
      iconProvider: AntDesign,
      label: "Dashboard",
      hide: false,
      route: "/dashboard",
      subItems: [],
    },
    {
      icon: "tool",
      iconProvider: Feather,
      label: "Job Order",
      route: "/maintenanceJOList",
      hide: false,
      subItems: [
        { label: "List", route: "/maintenanceJOList" },
        { label: "Create Job Order", route: "/CreateJO" },
      ],
    },
    {
      icon: "truck-delivery",
      iconProvider: MaterialCommunityIcons,
      label: "Ship Equipment",
      hide: false,
      route: "/shipEquipment",
      subItems: [],
    },
    {
      icon: "calendar-check",
      iconProvider: FontAwesome5,
      label: "Job Schedules",
      route: "/jobScheduleList",
      subItems: [{ label: "List", route: "/jobScheduleList" }],
    },
    {
      icon: "clock-alert",
      iconProvider: MaterialCommunityIcons,
      label: "Pending Jobs",
      route: "/pendingJobs",
      subItems: [],
    },
    {
      icon: "clipboard-list",
      iconProvider: MaterialCommunityIcons,
      label: "Equipment Usage Log",
      route: "/equipmentUsageLog",
      hide: false, // This will be controlled by API
      subItems: [
        { label: "Equip Usage List", route: "/equipUsageLogList" },
        { label: "Pending Equip. Usage", route: "/pendignEquipUsageLogList" },
      ],
    },
    {
      icon: "gear",
      iconProvider: EvilIcons,
      label: "Settings",
      route: "/settings",
      subItems: [],
    },
  ];

  // Load tab visibility from user data when user changes
  useEffect(() => {
    console.log('User data received:', user);
    console.log('User tabs data:', user?.tabs);
    console.log('User message tabs:', user?.message?.tabs);
    
    // The tabs data should be directly in the user object from the login response
    // Let me check if we need to access it differently
    let tabsData = user?.tabs;
    
    if (user && tabsData) {
      console.log('Found tabs data:', tabsData);
      const menuItems = transformLoginTabsToMenu(tabsData);
      setMenuItems(menuItems);
    } else {
      console.log('No tab data found, using default menu items');
      // Fallback to default menu items if no tab data
      setMenuItems(getDefaultMenuItems());
    }
  }, [user]);

  const toggleMenu = (item: MenuItem) => {
    if (!item.subItems || item.subItems.length === 0) {
      navigateTo(item.route);
      return;
    }

    setExpandedMenus((prev) => ({
      ...prev,
      [item.route]: !prev[item.route],
    }));
  };

  const navigateTo = (route: string) => {
    router.push(`${route}` as any);
  };

  const isActive = (route: string) => {
    return pathname === route;
  };

  const { logout, isLoggingOut } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContainer}
    >
      <View style={styles.logoContainer}>
        <Image
          style={styles.logo}
          source={require("@/assets/images/splash-icon.png")}
          resizeMode="contain"
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.menuContainer}>
        {menuItems
          .filter((m) => m.hide !== true)
          .map((item, index) => {
            const IconComponent = item.iconProvider;
            const isMenuActive = isActive(item.route);
            const isExpanded = expandedMenus[item.route];
            const hasSubItems = item.subItems && item.subItems.length > 0;

            // const { logout, isLoggingOut } = useAuth();

            return (
              <View key={index}>
                <TouchableOpacity
                  style={[
                    styles.menuItemContainer,
                    isMenuActive && { backgroundColor: Colors.primary },
                  ]}
                  onPress={() => toggleMenu(item)}
                >
                  <View style={styles.menuItemContent}>
                    <IconComponent
                      name={item.icon}
                      size={24}
                      color={isMenuActive ? "white" : "black"}
                    />
                    <Text
                      style={[
                        styles.navItemLabel,
                        { color: isMenuActive ? "white" : "black" },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {hasSubItems && (
                    <AntDesign
                      name={isExpanded ? "up" : "down"}
                      size={16}
                      color={isMenuActive ? "white" : "black"}
                      style={{ marginTop: 5, marginLeft: 4 }}
                    />
                  )}
                </TouchableOpacity>

                {hasSubItems && isExpanded && (
                  <View style={styles.submenuContainer}>
                    {item.subItems.map((subItem, subIndex) => {
                      const isSubItemActive = isActive(subItem.route);
                      return (
                        <TouchableOpacity
                          key={subIndex}
                          style={[
                            styles.submenuItem,
                            isSubItemActive && {
                              backgroundColor: Colors.primary + "30",
                            },
                          ]}
                          onPress={() => navigateTo(subItem.route)}
                        >
                          <Text
                            style={[
                              styles.submenuLabel,
                              isSubItemActive && { color: "white" },
                            ]}
                          >
                            {subItem.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
      </View>

      <View style={styles.logoutContainer}>
        <View style={styles.divider} />
        <Pressable
          onPress={handleLogout}
          style={isLoggingOut ? styles.logoutDisabled : styles.logoutButton}
          disabled={isLoggingOut}
        >
          <Text style={styles.logoutText}>
            {isLoggingOut ? "Logging out" : "Logout"}
          </Text>
        </Pressable>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    paddingTop: 10,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  logo: {
    width: "90%",
    height: 50,
    alignSelf: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 8,
    width: "100%",
  },
  menuContainer: {
    paddingTop: 12,
    gap: 8,
  },
  menuItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 4,
    marginVertical: 3,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  navItemLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 8,
  },
  submenuContainer: {
    paddingLeft: 12,
    backgroundColor: "#f5f5f5",
  },
  submenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 4,
  },
  submenuLabel: {
    fontSize: 14,
    fontWeight: "400",
  },
  userInfoWrapper: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 20,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  userImg: {
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
  },
  userDetailsWrapper: {
    marginTop: 25,
    marginLeft: 18,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 16,
    fontStyle: "italic",
    textDecorationLine: "underline",
  },

  logoutContainer: {
    width: "100%",
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  logoutButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  logoutDisabled: {
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },

});
// const styles = StyleSheet.create({
//   drawerContainer: {
//     flex: 1,
//     paddingTop: 10,
//   },
//   logoContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 15,
//     paddingHorizontal: 10,
//   },
//   logo: {
//     width: "90%",
//     height: 50,
//     alignSelf: "center",
//   },
//   divider: {
//     height: 1,
//     backgroundColor: "#e0e0e0",
//     marginVertical: 8,
//     width: "100%",
//   },
//   menuContainer: {
//     paddingTop: 12,
//     gap: 8,
//   },
//   menuItemContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingVertical: 8,
//     paddingHorizontal: 4,
//     borderRadius: 4,
//     marginVertical: 3,
//   },
//   menuItemContent: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   navItemLabel: {
//     fontSize: 15,
//     fontWeight: "500",
//     marginLeft: 8,
//   },
//   submenuContainer: {
//     paddingLeft: 12,
//     backgroundColor: "#f5f5f5",
//   },
//   submenuItem: {
//     paddingVertical: 10,
//     paddingHorizontal: 30,
//     borderRadius: 4,
//   },
//   submenuLabel: {
//     fontSize: 14,
//     fontWeight: "400",
//   },
//   userInfoWrapper: {
//     flexDirection: "row",
//     paddingHorizontal: 10,
//     paddingVertical: 20,
//     borderBottomColor: "#ccc",
//     borderBottomWidth: 1,
//     marginBottom: 10,
//   },
//   userImg: {
//     borderRadius: 25,
//     borderWidth: 1,
//     borderColor: "#ccc",
//     padding: 10,
//   },
//   userDetailsWrapper: {
//     marginTop: 25,
//     marginLeft: 18,
//   },
//   userName: {
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   userEmail: {
//     fontSize: 16,
//     fontStyle: "italic",
//     textDecorationLine: "underline",
//   },

//   logoutContainer: {
//     width: "100%",
//     paddingHorizontal: 8,
//     paddingBottom: 16,
//   },
//   logoutButton: {
//     backgroundColor: Colors.primary,
//     padding: 12,
//     borderRadius: 4,
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 8,
//   },
//   logoutText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "500",
//   },
// });
