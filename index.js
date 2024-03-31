#!/usr/bin/env node
import inquirer from "inquirer";
import OpenAI from "openai";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { exec } = require("child_process");

const openAI = new OpenAI({ apiKey: "YOUR_API_KEY" });

inquirer.prompt([{
    type: "input",
    name: "userInput",
    message: "What would you like to perform?",
}]).then((answers) => { runOpenAI(answers.userInput) });

/**
 * Call OpenAI API to get the command-line code for the user input
 * @param {string} userInput
 * @returns {Promise<void>}
 */
const runOpenAI = async (userInput) => {

    /**
     * Get the response from OpenAI API
     * @returns {Promise<string>}
     * */
    const getOpenAIResponse = async () => {
        const completion = await openAI.chat.completions.create({
            messages: [{ role: "system", content: `Just return the command-line query to ${userInput}` }],
            model: "gpt-3.5-turbo",
        });

        console.log(completion.choices[0]);
        return completion.choices[0]?.message?.content;
    };

    const openAIResponse = await getOpenAIResponse();

    // Run the command-line code upon user's consent
    // If not, prompt the user to retry or abort
    inquirer
        .prompt([
            {
                type: "list",
                name: "execute",
                message: "Would you like to execute the generated command?",
                choices: ["Yes", "No", "Retry"],
            },
        ])
        .then((answers) => {
            if (answers.execute === "Yes") {
                exec(openAIResponse, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`exec error: ${error}`);
                        return;
                    }
                    console.log("Output:\n", stdout);
                });
            } else if (answers.execute === "Retry") {
                inquirer
                    .prompt([
                        {
                            type: "input",
                            name: "userInput",
                            message: "What would you like to perform?",
                        },
                    ])
                    .then((answers) => {
                        runOpenAI(answers.userInput);
                    });
            }
        });
};
