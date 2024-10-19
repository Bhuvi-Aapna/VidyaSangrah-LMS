import React from "react";
import { Route, Routes } from "react-router-dom";
import Courses from "../../Landing/Coureses/Courses";

import Assignments from "../Assignment/Assignments";
import Edit from "../Edit/Edit";

import Home from "../Home/Home";
import Lecture from "../Lecture/Lecture";
import LmsAssignment from "../LMS/LmsAssignment";
import LmsLecture from "../LMS/LmsLecture";
import Employee from "../Employee/Employee";
import Login from "../UserLoginSignup/Login";
import Signup from "../UserLoginSignup/Signup";

function AllRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/addlecture" element={<Lecture />} />
      <Route path="/addassignment" element={<Assignments />} />
      <Route path="/employee" element={<Employee />} />
      <Route path="/edit" element={<Edit />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/lmslecture" element={<LmsLecture />} />
      <Route path="/lmsassignment" element={<LmsAssignment />} />
    </Routes>
  );
}

export default AllRoutes;
