import { colors } from '@/constants/theme';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

type SmsOptInQrCodeProps = {
  value: string;
  size?: number;
};

export function SmsOptInQrCode({ value, size = 180 }: SmsOptInQrCodeProps) {
  return (
    <View
      className="rounded-md p-3"
      style={{ borderWidth: 2, borderColor: colors.navy, backgroundColor: colors.white }}
    >
      <QRCode value={value} size={size} color={colors.navy} backgroundColor={colors.white} />
    </View>
  );
}
