import {render} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainScreen from '@/app/MainScreen'

describe('<MainScreen />', () => {
    test('renders correctly', () => {
        const { getByText } = render(
        <SafeAreaProvider>
           <MainScreen /> 
           </SafeAreaProvider>
           );
        getByText('IBDC');
    });
});
