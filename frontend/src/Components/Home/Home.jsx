import { Box, Button, Image } from "@chakra-ui/react";
import React from "react";
import { Link } from "react-router-dom";
import styles from "./Home.module.css"; // Import the CSS module

function Home() {
  return (
    <Box
      bgColor="#fff"
      margin="auto"
      p={2}
      h="100vh"
      display="flex"
      flexDir="column"
      alignItems="center"
    >
      <Box className={styles["Heading-vidya"]}>
        {" "}
        {/* Use class from CSS module */}
        Vidya Sangrah
      </Box>
      <Box
        bgColor="rgba(255, 255, 255, 0.13)"
        shadow="lg"
        w="fit-content"
        p="5%"
        m="auto"
        display="flex"
        flexDir="column"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        borderRadius={10}
      >
        <Image className={styles["logo-image"]} src="../../vidya-sangrah.png" />
        <Box>
          <Link to="/signup">
            <Button
              className="admin-button"
              bgColor="green"
              minW={200}
              color="white"
              onClick={() => {
                localStorage.setItem("user", "admin");
              }}
            >
              Admin
            </Button>
          </Link>
        </Box>
        <Link to="/signup">
          <Box>
            <Button
              className="student-button"
              bgColor="green"
              minW={200}
              color="white"
              onClick={() => {
                localStorage.setItem("user", "student");
              }}
            >
              Employee
            </Button>
          </Box>
        </Link>
      </Box>
    </Box>
  );
}

export default Home;
