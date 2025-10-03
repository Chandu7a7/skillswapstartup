import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';
import User from '../models/User.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// This function asks the AI to create a new test
export const generateTest = async (req, res) => {
    try {
        const { skill } = req.params;
        const prompt = `Create a 5-question multiple-choice quiz to test a beginner's knowledge of ${skill}. Provide the response as a valid JSON object with a single key "questions" which is an array. Each object in the array must have "questionText" (string), "options" (an array of 4 strings), and "correctAnswer" (the string of the correct option). Do not include any explanation or markdown formatting like \`\`\`json.`;

        const result = await model.generateContent(prompt);
        const jsonResponse = JSON.parse(result.response.text());

        const questionsForUser = jsonResponse.questions.map(q => ({
            questionText: q.questionText,
            options: q.options
        }));

        // Store the correct answers securely on the server session
        req.session.skillTest = {
            skill,
            questions: jsonResponse.questions
        };

        res.status(200).json({ success: true, data: questionsForUser });
    } catch (error) {
        console.error("Error generating test:", error);
        res.status(500).json({ success: false, message: "Failed to generate test." });
    }
};

// This function grades the user's submitted answers
export const submitTest = async (req, res) => {
    try {
        const userAnswers = req.body.answers;
        const testData = req.session.skillTest;

        if (!testData || userAnswers.length !== testData.questions.length) {
            return res.status(400).json({ success: false, message: "Invalid test submission." });
        }

        let score = 0;
        testData.questions.forEach((q, i) => {
            if (userAnswers[i] === q.correctAnswer) score++;
        });

        if (score >= 4) { // Passing score: 4 out of 5
            const user = await User.findById(req.user.id);
            const skillToVerify = user.skillsOffered.find(s => s.name === testData.skill);
            if (skillToVerify) {
                skillToVerify.isVerified = true;
                await user.save();
            }
            res.status(200).json({ success: true, message: `Congratulations! Your ${testData.skill} skill is now verified.`, score });
        } else {
            res.status(200).json({ success: false, message: `You did not pass (Score: ${score}/5). Please try again later.`, score });
        }

        req.session.skillTest = null; // Clear test from session
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to submit test." });
    }
};