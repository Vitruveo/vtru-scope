import { FC } from "react";
import { useSelector } from "@/store/hooks";
import Link from "next/link";
import { styled } from '@mui/material/styles'
import { AppState } from "@/store/store";
import Image from "next/image";

const Logo = () => {
  const customizer = useSelector((state: AppState) => state.customizer);
  const LinkStyled = styled(Link)(() => ({
    height: customizer.TopbarHeight,
    width: customizer.isCollapse ? "40px" : "180px",
    overflow: "hidden",
    display: "block",
  }));

  if (customizer.activeDir === "ltr") {
    console.log(customizer.TopbarHeight)
    return (
      <LinkStyled href="/" sx={{ mt: 2.5 }}>
        {customizer.activeMode === "dark" ? (
          <Image
            src="/images/logo.png"
            alt="logo"
            height={41}
            width={180}
            priority
          />
        ) : (
          <Image 
            src={"/images/logo.png"}
            alt="logo"
            height={41}
            width={180}
            priority
          />
        )}
      </LinkStyled>
    );
  }

  return (
    <LinkStyled href="/">
      {customizer.activeMode === "dark" ? (
        <Image
          src="/images/logo.png"
          alt="logo"
          height={41}
          width={180}
          priority
        />
      ) : (
        <Image
          src="/images/logo.png"
          alt="logo"
          height={41}
          width={180}
          priority
        />
      )}
    </LinkStyled>
  );
};

export default Logo;
