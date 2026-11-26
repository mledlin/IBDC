import { useAsyncStorage } from "@/hooks/useAsyncStorage";
import { useEffect, useState, useCallback } from "react";



const UPLOAD_PERMISSION_KEY = "uploadPermission";

/**
 * Steps:
 * Load/set initial value >
 * Determine if user already has permissions
 * b1 - don't ask
 * b2 - ask only if time is greater than a week
 */

type PermissionInfo = {
    permission: boolean
}

// Prompts the user to enable updating permission to the Rob Dollar Foundation Analytic Server
export default function useUserUploadPermissions() {
    const {data, error, isLoading, setValue} = useAsyncStorage(UPLOAD_PERMISSION_KEY);
    const [permission, setPermission] = useState<PermissionInfo>((): PermissionInfo => {
        return data === null ? {permission: false} : JSON.parse(data) as PermissionInfo;
    });

    // This should run once on mount. Set initial or stored values and supply them to its callers.
    useEffect(() => {
        if (isLoading) {
            console.log("useUserUploadPermissions:useEffect - useAsyncStorage === isLoading");
            return;
        }
        console.log("Temp-Debug permission value: ", permission);
    },[isLoading, permission]);

    const updatePermission =  useCallback(async () => {
        await setValue(!permission);
        setPermission({permission: !permission.permission});
    }, [setValue, permission]);

    return {
        permission: permission,
        error: error,
        isLoading: isLoading,
        updatePermission
    }
}




