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
    permission: boolean,
    lastPopUp: Date;
}

// Prompts the user to enable updating permission to the Rob Dollar Foundation Analytic Server
export default function useUserUploadPermissions() {
    const {data, error, isLoading, setValue} =  useAsyncStorage(UPLOAD_PERMISSION_KEY);
    const [permission, setPermission] = useState(false);
    const [popUp, setPopUp] = useState(new Date);

    // Runs once on mount
    useEffect(() => {
        const setInitData = async () => {
            if (data === null) { // This should run the first time the user runs the app
                const initPermission: PermissionInfo = {permission: permission, lastPopUp: popUp};
                await setValue(initPermission);
            } else { // Retrieve saved data
                try {
                    const savedData: PermissionInfo = (JSON.parse(data) as PermissionInfo);
                    setPermission(savedData.permission);
                    setPopUp(savedData.lastPopUp);
                } catch (error) {
                    console.error(error);
                    console.log("useUserUploadPermissions:useEffect - parsing incorrect object shape");
                }
            }
        }
        setInitData();
    })

    const togglePermission = async () => {

    }
}


