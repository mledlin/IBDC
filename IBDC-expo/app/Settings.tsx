import { View, Text, StyleSheet } from "react-native";


export default function Settings(){
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Settings Screen</Text>
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