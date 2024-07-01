import Box from '@mui/material/Box'

interface BlankLayoutProps {
  children: React.ReactNode;
}

const BlankLayout = ({ children }: BlankLayoutProps) => {
  return (
    <Box>{children}</Box>
  )
};

export default BlankLayout;



