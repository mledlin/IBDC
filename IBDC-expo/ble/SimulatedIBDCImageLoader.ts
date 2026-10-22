import { Asset } from "expo-asset";
import { File } from "expo-file-system";

export interface LoadImageData {
    loadImagesAsBytes(): Promise<Uint8Array[]>
}


export class SimulatedIBDCImageLoader implements LoadImageData {

    private MOCK_IMAGE_MODULES = [
        require("@/assets/images/IBDCExampleData/1.jpeg"),
        require("@/assets/images/IBDCExampleData/2.jpeg"),
        require("@/assets/images/IBDCExampleData/3.jpeg"),
        require("@/assets/images/IBDCExampleData/4.jpeg"),
        require("@/assets/images/IBDCExampleData/5.jpeg"),
        require("@/assets/images/IBDCExampleData/6.jpeg"),
        require("@/assets/images/IBDCExampleData/7.jpeg"),
        require("@/assets/images/IBDCExampleData/8.jpeg"),
        require("@/assets/images/IBDCExampleData/9.jpeg"),
        require("@/assets/images/IBDCExampleData/10.jpeg"),
        require("@/assets/images/IBDCExampleData/11.jpeg"),
        require("@/assets/images/IBDCExampleData/12.jpeg"),
        require("@/assets/images/IBDCExampleData/13.jpeg"),
        require("@/assets/images/IBDCExampleData/14.jpeg"),
        require("@/assets/images/IBDCExampleData/15.jpeg"),
        require("@/assets/images/IBDCExampleData/16.jpeg"),
        require("@/assets/images/IBDCExampleData/17.jpeg"),
        require("@/assets/images/IBDCExampleData/18.jpeg"),
        require("@/assets/images/IBDCExampleData/19.jpeg"),
        require("@/assets/images/IBDCExampleData/20.jpeg"),
    ];

     public async loadImagesAsBytes(): Promise<Uint8Array[]> {
        const assets: Asset[] = await Asset.loadAsync(this.MOCK_IMAGE_MODULES);

        const bytesList: Uint8Array[] = [];
        for (const asset of assets) {
            if(!asset.localUri) {
                throw new Error(`SimulatedIBDC: mock image asset "${asset.name}" has not localUri after loading.`)
            }
            const file = new File(asset.localUri);
            bytesList.push(await file.bytes());
        }
        return bytesList;
    }
}