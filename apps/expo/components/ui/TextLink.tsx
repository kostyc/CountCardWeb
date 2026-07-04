import { useRouter, type Href } from 'expo-router';
import { Pressable, Text, type TextStyle } from 'react-native';

interface TextLinkProps {
  href: Href;
  children: string;
  style?: TextStyle;
}

/** Navigation link text without expo-router Slot (avoids web style-array errors). */
export function TextLink({ href, children, style }: TextLinkProps) {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(href)}>
      <Text style={style}>{children}</Text>
    </Pressable>
  );
}
