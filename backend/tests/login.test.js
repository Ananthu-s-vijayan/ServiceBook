const request=require("supertest");
const app=require("../src/app");

describe("POST /api/user/register",()=>{
    test("should a new user can register",async()=>{
        const response=await request(app)
        .post("/api/user/register")
        .send(
            {
                fullName:"Nanda",
                email:"samplee@gmail.com",
                password:"1234kj"
            }
        )
    })
});