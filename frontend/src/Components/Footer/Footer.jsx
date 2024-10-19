import { Box, Image,Icon, Text, Grid} from '@chakra-ui/react'
import React from 'react'
import {SlSocialFacebook, SlSocialGithub, SlSocialInstagram, SlSocialLinkedin, SlSocialTwitter, SlSocialYoutube} from 'react-icons/sl'
import {TiSocialYoutube} from 'react-icons/ti'



function Footer() {
  return (
    <Box  w={"100%"} bgColor={"black"}>
     <Box margin={"auto"} width={"80%"}>
        {/* --------Fist box------- */}
        <Box display={"flex"} justifyContent={"space-between"} alignItems={"center"} pt={10} pb={10} >
           <Box display={{ base: "none", sm: "none", md: "flex", lg: "flex", xl: "flex" }} justifyContent={"space-between"} alignItems={"center"} gap={{ base:4 , sm: 6, md: 8, lg:10, xl:10 }} fontSize={25} >
           <Box><Text color={"gray"}>Follow us-</Text></Box>
           <Box><Icon color={"gray"}  as={SlSocialTwitter }/></Box>
           <Box><Icon color={"gray"} as={SlSocialInstagram }/></Box>
           <Box><Icon color={"gray"} as={SlSocialLinkedin }/></Box>
           <Box ><Icon color={"gray"} as={TiSocialYoutube}/></Box>
           <Box><Icon  color={"gray"} as={SlSocialFacebook }/></Box>
           <Box><Icon color={"gray"}  as={SlSocialGithub }/></Box>         
           </Box>
        </Box>
        {/* -------second box------ */}
        
        {/* ---------------for base and small screen --------- */}
        <Box display={{ base: "flex", sm: "flex", md: "none", lg: "none", xl: "none" }} justifyContent={"space-between"} alignItems={"center"} gap={{ base:2 , sm: 4}} fontSize={{ base:20 , sm: 22}} >
           <Box><Text color={"gray"}>Follow us-</Text></Box>
           <Box><Icon color={"gray"}  as={SlSocialTwitter }/></Box>
           <Box><Icon color={"gray"} as={SlSocialInstagram }/></Box>
           <Box><Icon color={"gray"} as={SlSocialLinkedin }/></Box>
           <Box ><Icon color={"gray"} as={TiSocialYoutube}/></Box>
           <Box><Icon  color={"gray"} as={SlSocialFacebook }/></Box>
           <Box><Icon color={"gray"}  as={SlSocialGithub }/></Box>         
           </Box>

     </Box>
    </Box>
  )
}

export default Footer