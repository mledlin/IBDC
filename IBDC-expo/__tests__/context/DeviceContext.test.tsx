import { useDevice } from "@/context/DeviceContext"
import { act } from "react";


/** Upon testing of DeviceContext, I'm realizing that there needs to be additional dependency injections in the module
 to test the behavior. These dependencies need to be injected in the _layout.tsx file and passed as properties
 to all children of DeviceProvider. This will allow for creation of a DeviceProvider with mock modules instead of
 hardware specific modules.
 **/

test("connects to a device", async () => {

    // Capture device capabilities and state information
    let latestContext = useDevice();

    // Scan for available devices.
    await act(async () => {
        await latestContext.scan();
    });

    // Retrieve a device discovered by the scan.
    const discoveredDevice = latestContext.devices[0];

    expect(discoveredDevice).toBeDefined();

    // Connect to that device.
    await act(async () => {
        await latestContext.connect(discoveredDevice.id);
    });

    // Verify that state was initialized.
    expect(latestContext.device).not.toBeNull();
    expect(latestContext.device?.id).toBe(discoveredDevice.id);
    expect(latestContext.device?.status).toBe("connected");
});











