import { View, Text, StyleSheet, Button, Alert } from "react-native";

function showAlert(message: string) {
    Alert.alert(message)
}

export default function Settings(){
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Settings Screen</Text>
            <Button onPress= {() => showAlert("Gracias")}
             title={"Util"}/>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff",
    },
    text: {
        fontSize: 28,
        fontWeight: "bold",
        color: "black",
    },
    link: {
        fontSize: 18,
        color: "blue",
        textDecorationLine: "underline",
    },
});