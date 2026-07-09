"use client";
import { ThemeContext } from "@/context/ThemeContext";
import { Box, Typography } from "@mui/material";
import { useContext } from "react";

export const HomePage = () => {
  const theme = useContext(ThemeContext);
  return (
    <>
      <Box>
        <Typography>{theme}</Typography>
      </Box>
    </>
  );
};
