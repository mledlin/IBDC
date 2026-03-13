import React from "react";
import { View, Text, StyleSheet, Dimensions, Pressable, ScrollView } from "react-native";
import Animated,
{
    useSharedValue, 
    useAnimatedScrollHandler, 
    useAnimatedStyle, 
    interpolate,
    Extrapolation,
    SharedValue,
} from "react-native-reanimated";

import { useLocalSearchParams } from "expo-router";

//define a contants that holds the phone's window width 
const { width } = Dimensions.get('window');
//resize the card to be 3/4 the width of the screen
const CARD_WIDTH = width * 0.75;
const CARD_GAP = 16; 
const STEP = CARD_GAP + CARD_WIDTH;
const SIDE_PEEK = (width - CARD_WIDTH)/2;

//types for typescript
interface CardItem {
    id: string; 
    title: string;
    subtitle: string;
}
interface CardProps {
    item: CardItem;
    index: number;
    scrollX: SharedValue<number>;
    onPress: () => void;
}

 const items: CardItem[]  = [
    {id: '1', title: 'Incident 1', subtitle: "Reported at 10:20 a.m. on Mullberry Ave"},
    {id: '2', title: 'Incident 2', subtitle: "reported at 11:30 a.m. on Hulkel Dr."},
    {id: '3', title: 'Incident 3', subtitle: "reported at 12:50 a.m. on Winston St."},

  ];

  function Card({ item, index, scrollX, onPress }: CardProps) {
    const animatedStyle = useAnimatedStyle(() => {
        const inputRange =[(index -1) * STEP, index * STEP, (index + 1)* STEP];
        const scale = interpolate(scrollX.value, inputRange, [0.88, 1, 0.88], Extrapolation.CLAMP);
        const opacity = interpolate(scrollX.value, inputRange, [0.55, 1, 0.55], Extrapolation.CLAMP);
        return {transform: [{scale}], opacity };
    });
    return (
        <Animated.View style={[styles.card, animatedStyle]}>
            <Pressable style={styles.cardInner} onPress={onPress}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </Pressable>
        </Animated.View>
    );
  }
function SessionDetailView(){
    return (
        <View style={styles.rideContainer}>
            
        </View>
    )
}

export default function RideDetail() {
  const scrollX = useSharedValue<number>(0);
  const scrollHandler = useAnimatedScrollHandler((e)=>{
    scrollX.value = e.contentOffset.x;
  });
 
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        
        {/* Header Section*/}
        <View style={styles.container}>
      <Text style={styles.heading}>Recent Incidents</Text>
      <Text style={styles.subheading}>Tap a card to view details</Text>
      </View>

      <Animated.FlatList 
      data={items} 
      renderItem={(item)=> item.id}
      horizontal
      snapToInterval={STEP}
      snapToAlignment="center"
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{paddingHorizontal: SIDE_PEEK}}
      ItemSeparatorComponent={() => <View style={{width: CARD_GAP}} />}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      renderItem={({item, index}) => (
        <Card
        item = {item}
        index = {index}
        scrollX={scrollX}
        onPress={() => console.log('pressed', item.id)}
        />
      )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    screen:{
        flex:1,
        backgroundColor: '#f2f2f7'
    },
    content: {
        paddingBottom: 40,
    },
    heading: {
        fontSize: 26, 
        fontWeight: '700',
        color: '1c1c1e'
    },
    subheading: {
        fontSize: 15, 
        color: '#8e8e93', 
        marginTop: 4,
    },
    card: {
        width: CARD_WIDTH,
        height: 180, 
        borderRadius: 18, 
        backgroundColor: '#fff',
        shadowColor: '#000', 
        shadowOffset:{ width: 0, height: 8},
        shadowOpacity: 0.1, 
        shadowRadius: 12,
        elevation: 6,
    },
    cardInner: { 
        flex:1, 
        padding: 24, 
        justifyContent: 'center',
    },
    cardTitle:{
        fontSize: 20, 
        fontWeight: '700',
        color: '#1c1c1e', 
        marginBottom: 8,
    },
    cardSubtitle:{
        fontSize: 14, 
        color: "#8e8e93",
    },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
    color: "black",
  },
  rideContainer:{
    marginHorizontal: 24,
    backgroundColor: "#fff", 
    borderRadius: 16,
    padding: 20, 
    marginBottom: 28, 
    shadowColor: "#000", 
    shadowOffset: {width: 0, height: 2}, 
    shadowOpacity: 0.07, 
    shadowRadius: 8, 
    elevation: 3,
  },
});