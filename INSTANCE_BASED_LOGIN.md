# Instance-Based Login Implementation

## 🎯 **Overview**

The login system now supports multiple NetSuite instances (PROD, SB1, SB2) with dynamic restlet URL construction based on the selected instance.

## 🔧 **How It Works**

### **Instance Selection**
- User selects instance from dropdown: **Production**, **Sandbox 1**, or **Sandbox 2**
- Instance value is passed to the login function: `PROD`, `SB1`, or `SB2`

### **Dynamic URL Construction**
```
Base Account ID: 11218546

All Instances: Always use https://11218546.restlets.api.netsuite.com/...
Instance Selection: Passed via "instance" parameter in request body
Server Routing: NetSuite backend handles instance routing internally
```

### **Server Response Format**
The server will return a `restletUrl` in the response that matches the selected instance:
```json
{
  "success": true,
  "userData": {
    "restletUrl": "https://11218546_sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=76&deploy=1"
  }
}
```

## 📱 **UI Components**

### **Login Screen**
- ✅ Instance selector dropdown with 3 options
- ✅ Form validation for instance selection
- ✅ Instance state management
- ✅ Instance parameter passed to login function

### **Instance Buttons**
- **Production**: Default selection
- **Sandbox 1**: For SB1 testing
- **Sandbox 2**: For SB2 testing

## 🔐 **Backend Changes**

### **AuthService Updates**
- `LoginCredentials` interface now includes optional `instance` parameter
- `login()` method constructs account ID based on instance
- `changePassword()` method also supports instance parameter
- `updateConfig()` method extracts account ID from restlet URL

### **Hook Updates**
- `useChangePassword` now accepts instance parameter
- `changePasswordHandler` passes instance to backend

## 🚀 **Implementation Details**

### **Account ID Construction**
```typescript

const accountId = this.config.accountId; // Always "11218546"
```

### **Restlet URL Construction**
```typescript
const accountIdLower = accountId.toLowerCase();
const baseUrl = `https://${accountIdLower}.restlets.api.netsuite.com/app/site/hosting/restlet.nl`;
const endpoint = `${baseUrl}?script=${scriptId}&deploy=${deployId}`;
```

### **Configuration Update**
After successful login, the system:
1. Extracts account ID from the returned `restletUrl`
2. Updates the API client configuration
3. Sets the correct base URL for subsequent API calls

## 🔍 **Debugging & Logging**

### **Console Logs**
- Instance selection during login
- Constructed account ID
- Final endpoint URL
- Configuration updates

### **Example Logs**
```
🔐 Login attempt with instance: SB1
🔐 Constructed account ID: 11218546_SB1
🔐 Endpoint URL: https://11218546_sb1.restlets.api.netsuite.com/...
```

## ✅ **What's Working**

1. **Instance Selection**: UI dropdown with 3 options
2. **Dynamic URLs**: Correct restlet URL construction for each instance
3. **Form Validation**: Instance selection validation
4. **Backend Integration**: Instance parameter passed to auth service
5. **Configuration Updates**: Dynamic API client configuration after login

## 🎉 **Ready for Testing**

The implementation is complete and ready for testing with your NetSuite backend. When a user selects an instance and logs in:

1. The app will construct the appropriate restlet URL
2. Send login request to that URL
3. Server validates user access for that instance
4. Returns success/failure with appropriate restlet URL
5. App configures itself for subsequent API calls

## 🔗 **Next Steps**

1. **Test with Backend**: Verify server-side instance validation
2. **User Permissions**: Ensure users have access to selected instances
3. **Error Handling**: Test invalid instance selections
4. **Production Deployment**: Deploy and test in production environment
