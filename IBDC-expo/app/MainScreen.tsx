import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function MainScreen(){
  const router = useRouter();
  
  return (
      <View style={styles.container}>
        <Text style={styles.text}>Main Screen</Text>

       <Pressable style={styles.button} onPress={() => router.push("/pairDevice")}>
        <Text style={styles.buttonText}>Pair Device</Text>
       </Pressable>

       <Pressable style={styles.button} onPress={() => router.push("/IncidentHistory")}>
        <Text style={styles.buttonText}>Incident History</Text>
       </Pressable>
 
        {//<Pressable style={styles.button} onPress={() => router.push("/rideSessions")}>
        //<Text>PairDevice</Text>
        //</Pressable>} uncomment out when this screen is added 
        }
        <Pressable style={styles.button} onPress={() => router.push("/Settings")}>
        <Text style={styles.buttonText} >Settings</Text>
       </Pressable>


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
  buttonText:{
    fontWeight: "bold",
    color: "white",
  },
  link: {
    fontSize: 18,
    color: "blue",
    textDecorationLine: "underline",
  },
  button: {
    padding: 20,
    backgroundColor: "blue", 
    marginBottom: 15, 
    borderRadius: 10
  }
});
