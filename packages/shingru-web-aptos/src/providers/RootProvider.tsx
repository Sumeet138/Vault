import { PropsWithChildren } from "react";
import { PhotonProvider } from "./PhotonProvider";
import { SoundProvider } from "./SoundProvider";

export default function RootProvider({ children }: PropsWithChildren) {
  return (
    <SoundProvider>
      <PhotonProvider>
        {children}
      </PhotonProvider>
    </SoundProvider>
  );
}
