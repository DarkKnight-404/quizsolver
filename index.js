import { OpenAI } from "openai";
import express from "express";
import cookieParser from "cookie-parser"; // Import cookie-parser
import cors from "cors";
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";



dotenv.config()
let app = express();

app.use(cors());
// app.use(dotenv())
app.use(cookieParser());


function verMiddleware(req, res, next) {

    let token = req.cookies["session_token"];
    let refreshToken = req.cookies["refresh_token"];

    if (!token) return res.send("no token found buddy");

    jwt.verify(token, process.env["SECRET_KEY"], (err, decoded) => {
        if (err) {

            if (refreshToken) {


                jwt.verify(refreshToken, process.env["secret_key"], (err2, decoded2) => {

                    if (err2) {
                        res.send("there is an error generating token " + JSON.stringify(err2))
                        return;
                    }
                    else {


                        console.log("refresh token expiry data ");
                        // console.log(decoded2.expiresIn)
                        // console.log(new Date(decoded2.expiresIn))
                        // console.log(new Date(decoded2.expiresIn).getTime())
                        // console.log(new Date(decoded2.expiresIn).getTime() - new Date(Date.now()).getTime());



                        let jwtToken = jwt.sign({
                            isValidUser: true,
                            name: "Rohit Sawant",
                            div: "ty-core 6",
                            enrNo: "ADT23SOCB0872"
                        }, process.env["secret_key"], { expiresIn: "15m" });
                        res.cookie("session_token", jwtToken);

                        let currentDate = Date.now();
                        let noOfDaysRem = (new Date(decoded2.expiresIn).getTime() - new Date(currentDate).getTime()) / (60 * 60 * 1000 * 24);

                        console.log("no of days remaining to expire refresh token : " + noOfDaysRem);

                        if (noOfDaysRem < 10) {
                            let jwtRefreshToken = jwt.sign({
                                isValidUser: true,
                                createdAt: new Date(currentDate),
                                expiresIn: new Date(currentDate).setDate(new Date(currentDate).getDate() + 90),
                                name: "Rohit Sawant",
                                div: "ty-core 6",
                                enrNo: "ADT23SOCB0872"
                            }, process.env["secret_key"], { expiresIn: `${24 * 30 * 3}hr` });


                            res.cookie("refresh_token", jwtRefreshToken);
                            console.log("new refresh session token geenrated  : ", jwtRefreshToken)
                        }

                        console.log("---------------------------------------------")
                        console.log("new session token : ", jwtToken)



                        req.user = decoded2;
                        console.log(decoded2);
                        next();
                    }

                })

            }
            else {
                res.send("failed to decode" + JSON.stringify(err));

            }

        }
        else {
            res.user = decoded;
            console.log(decoded);
            next();
        }


    })


}

console.log(process.env["HUGGINGFACESKEY"]);
async function getAnswer(string) {

    const client = new OpenAI({
        baseURL: "https://router.huggingface.co/v1",
        apiKey: process.env["HUGGINGFACESKEY"],
    });

    const chatCompletion = await client.chat.completions.create({
        model: "zai-org/GLM-4.6:novita",
        messages: [
            {
                role: "user",
                content: string,
            },
        ],
    });

    console.log(chatCompletion.choices[0].message);
    console.log(JSON.parse(chatCompletion.choices[0].message.content));

    return JSON.parse(chatCompletion.choices[0].message.content);
}

app.use(express.text());
app.post("/getAnswerJson", verMiddleware, (req, res) => {
    console.log("request recieved at the backend");
    console.log(req.body);
    let questions = JSON.parse(req.body).questions;
    getAnswer(`
You are a JSON generator. 
You must respond ONLY in valid JSON — do not include any explanations, code blocks, or text.

For the following questions, return your answers in this exact format:
[
  { "index": <question_number>, "answerOption": <option_number> },
  ...
]

Questions:
${questions}

                `).then((val) => {
        res.send(JSON.stringify(val));
    })
})



app.get('/setcookies', (req, res) => {

    let encriptToken = jwt.sign({
        isValidToken: true
    }, "this_is_a_secret_key", {
        expiresIn: "10s"
    })

    res.cookie("session_token", encriptToken);

    res.send("cookies loaded successfully");
})


app.get("/loginpage", (req, res) => {
    res.send(`
    <div>
        <input type="text" id="pass"/>
        <button onclick="func()">submit</button>
        
    </div>
    <script>
            function func(){
            let ele = document.getElementById("pass");
            let xml = new XMLHttpRequest();
            xml.open("POST","/login");
            xml.send(JSON.stringify({
                pass: ele.value
            }))
            }
        </script>
        `)
})

app.post("/login", express.text(), (req, res) => {
    console.log("login request recieved ");
    let data = JSON.parse(req.body);
    console.log(data);

    if (data["pass"] === "314159") {

        let currentDate = Date.now();

        let jwtToken = jwt.sign({
            isValidUser: true,
            name: "Rohit Sawant",
            div: "ty-core 6",
            enrNo: "ADT23SOCB0872"
        }, process.env["secret_key"], { expiresIn: "15m" });
        let jwtRefreshToken = jwt.sign({
            isValidUser: true,
            createdAt: new Date(currentDate),
            expiresIn: new Date(currentDate).setDate(new Date(currentDate).getDate() + 90),
            issuedAt: Date.now(),
            name: "Rohit Sawant",
            div: "ty-core 6",
            enrNo: "ADT23SOCB0872"
        }, process.env["secret_key"], { expiresIn: `${24 * 30 * 3}h` });

        console.log(jwtToken);

        res.cookie("session_token", jwtToken);
        res.cookie("refresh_token", jwtRefreshToken);

        res.send(JSON.stringify({
            status: true,
            name: "Rohit Sawant",
            div: "ty-core 6",
            enrNo: "ADT23SOCB0872"
        }));



    }
    else {
        res.send({
            status: false
        })
    }
})
app.get("/getcookies", (req, res) => {

    let decodeData = jwt.verify(req.cookies["session_token"], process.env["secret_key"]);

    res.send(decodeData);

})

app.get("/veruser", verMiddleware, (req, res) => {
    console.log("user verified successfully")
    res.send("successfull to verify token " + JSON.stringify(req.cookies));
})






app.get("/isuserlogged", verMiddleware, (req, res) => {
    console.log("user verified successfully")
    res.send({
        isUserLogged: true
    })
})


let port = process.env.PORT;
app.listen(port | 9600, () => {
    console.log("application deployed on localhost:"+port)
})

