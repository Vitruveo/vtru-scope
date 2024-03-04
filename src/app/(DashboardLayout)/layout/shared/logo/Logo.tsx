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
    width: customizer.isCollapse ? "40px" : "220px",
    overflow: "hidden",
    display: "block",
  }));

  if (customizer.activeDir === "ltr") {
    console.log(customizer.TopbarHeight)
    return (
      <LinkStyled href="/" sx={{ mt: 2.5 }}>
        {customizer.activeMode === "dark" ? (
          <Image
            src="/images/scope.svg"
            alt="logo"
            height={39}
            width={220}
            priority
          />
        ) : (
          <Image 
            src={"/images/scope.svg"}
            alt="logo"
            height={39}
            width={220}
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
          src="/images/scope.svg"
          alt="logo"
          height={39}
          width={220}
        priority
        />
      ) : (
        <Image
          src="/images/scope.svg"
          alt="logo"
          height={39}
          width={220}
          priority
        />
      )}
    </LinkStyled>
  );
};

export default Logo;
