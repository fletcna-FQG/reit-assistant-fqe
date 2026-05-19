import { colors, shadows } from '@/constants/theme';
import { Pressable, Modal as RNModal, ScrollView, Text, View } from 'react-native';

type ModalProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function Modal({ visible, title, onClose, children, footer }: ModalProps) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center px-md"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onPress={onClose}
      >
        <Pressable
          className="max-h-[80%] w-full max-w-md rounded-lg bg-white p-md"
          style={shadows.lg}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="mb-md flex-row items-center justify-between">
            <Text className="text-h3 text-navy">{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text className="text-h3 text-text-secondary">✕</Text>
            </Pressable>
          </View>
          <ScrollView className="max-h-96">{children}</ScrollView>
          {footer ? <View className="mt-md">{footer}</View> : null}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
