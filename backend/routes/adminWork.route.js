const express = require("express")
let { UserListModel } = require("../model/userList.model")
let { LectureModel } = require("../model/lecture.model")
let { AssignmentsModel } = require("../model/assignment.model")


const adminWork = express.Router()

//-------------------------students-------------------------------//
// --------create student -----//

adminWork.post("/createStudent", async (req, res) => {
  let { name, email, student_id, image, userId, state, course, coursetime, student_userId, index } = req.body

  //----check if student with this student id is already exist or not----//
  let isUserIdPresent = await UserListModel.findOne({ student_id: student_id })
  if (isUserIdPresent) {
    res.send({ "msg": ` student with student id ${student_id} already exist` })
  } else {
    try {
      let newUser = new UserListModel({ name, email, student_id, image, userId, state, course, coursetime, student_userId, index })
      await newUser.save()
      res.send({ "msg": "new student added" })
    } catch (error) {
      res.send({ "msg": error })
    }
  }
})

// --------get students list -----//
adminWork.get("/getStudentsList", async (req, res) => {

  try {
    let students = await UserListModel.find()

    res.send({ "msg": students })
  } catch (error) {
    res.send({ "msg": error })
  }
})

//--------------------------lectures--------------------------------------//
//------------create lecture------------//

adminWork.post("/createLecture", async (req, res) => {
  let { topic_name, lecture_date, lecture_time, teacher_name, lecture_id, lecture_type, course, userId } = req.body

  //----check if lecture with this lecture id is already exist or not----//
  let isLectureIdPresent = await LectureModel.findOne({ lecture_id: lecture_id })
  if (isLectureIdPresent) {
    res.send({ "msg": ` lecture with lecture id ${lecture_id} already exist` })
  } else {
    try {
      let newLecture = new LectureModel({ topic_name, lecture_date, lecture_time, teacher_name, lecture_id, lecture_type, course, userId })
      await newLecture.save()
      res.send({ "msg": "new lecture added" })
    } catch (error) {
      res.send({ "msg": error })
    }
  }
})

// --------get Lectures list -----//
adminWork.get("/getLectures", async (req, res) => {

  try {
    let lectures = await LectureModel.find()

    res.send({ "msg": lectures })
  } catch (error) {
    res.send({ "msg": error })
  }
})

// --------delete lecture-----//
adminWork.delete("/removelecture/:id", async (req, res) => {
  let id = req.params.id
  let userId = req.body.userId
  let lecture = await LectureModel.findOne({ _id: id })

  try {
    if (userId == lecture.userId) {
      let lecture = await LectureModel.findByIdAndDelete({ _id: id })

      res.send({ "msg": `${lecture.lecture_id} id's lecture removed successfully` })
    } else {
      res.send({ "msg": "not authorized" })
    }

  } catch (error) {
    res.send({ "msg": error })
  }
})

// --------Edit lecture -----//
adminWork.patch("/editlecture/:id", async (req, res) => {
  let data = req.body
  let id = req.params.id
  let userId = req.body.userId
  let lecture = await LectureModel.findOne({ _id: id })

  try {
    if (userId == lecture.userId) {

      let lecture = await LectureModel.findByIdAndUpdate({ _id: id }, data)

      res.send({ "msg": `${lecture.lecture_id} id's lecture information updated successfully` })
    } else {
      res.send({ "msg": "not authorized" })
    }
  } catch (error) {
    res.send({ "msg": error })
  }
})

//--------------------------assignment--------------------------------------//
//------------create assignment------------//

adminWork.post("/createassignment", async (req, res) => {
  let { topic_name, assignment_date, assignment_time, teacher_name, assignment_id, assignment_type, course, userId } = req.body

  //----check if assignment with this assignment id is already exist or not----//
  let isassignmentIdPresent = await AssignmentsModel.findOne({ assignment_id: assignment_id })
  if (isassignmentIdPresent) {
    res.send({ "msg": ` assignment with assignment id ${assignment_id} already exist` })
  } else {
    try {
      let newassignment = new AssignmentsModel({ topic_name, assignment_date, assignment_time, teacher_name, assignment_id, assignment_type, course, userId })
      await newassignment.save()
      res.send({ "msg": "new assignment added" })
    } catch (error) {
      res.send({ "msg": error })
    }
  }
})

// --------get assignments list -----//
adminWork.get("/getassignment", async (req, res) => {

  try {
    let assignment = await AssignmentsModel.find()

    res.send({ "msg": assignment })
  } catch (error) {
    res.send({ "msg": error })
  }
})


// --------delete assignment-----//
adminWork.delete("/removeassignment/:id", async (req, res) => {
  let id = req.params.id
  let userId = req.body.userId
  let assignment = await AssignmentsModel.findOne({ _id: id })

  try {
    if (userId == assignment.userId) {

      let assignment = await AssignmentsModel.findByIdAndDelete({ _id: id })

      res.send({ "msg": `${assignment.assignment_id} id's assignment removed successfully` })
    } else {
      res.send({ "msg": "not authorized" })

    }
  } catch (error) {
    res.send({ "msg": error })
  }
})


// --------Edit assignment -----//
adminWork.patch("/editassignment/:id", async (req, res) => {
  let data = req.body
  let id = req.params.id
  let userId = req.body.userId
  let assignment = await AssignmentsModel.findOne({ _id: id })
  try {
    if (userId == assignment.userId) {

      let assignment = await AssignmentsModel.findByIdAndUpdate({ _id: id }, data)

      res.send({ "msg": `${assignment.assignment_id} id's assignment information updated successfully` })
    } else {
      res.send({ "msg": "not authorized" })
    }
  } catch (error) {
    res.send({ "msg": error })
  }
})
module.exports = { adminWork }