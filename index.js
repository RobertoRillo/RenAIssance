const express = require('express');
const { OpenAI } = require("@langchain/openai");
const dotenv = require("dotenv");
const cors = require('cors');
const { PromptTemplate } = require("@langchain/core/prompts");
const { StructuredOutputParser } = require("langchain/output_parsers");
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); 

const parser = StructuredOutputParser.fromNamesAndDescriptions({
  answer: "answer to the user's question",
});

const formatInstructions = parser.getFormatInstructions();

const prompt = new PromptTemplate({
  template:
    "You were a renaissance painter, answer question according to the era you lived in\n{format_instructions}\ Question: {question} ",
  inputVariables: ["question"],
  partialVariables: {format_instructions: formatInstructions },  
});

const model = new OpenAI({ 
  modelName: "gpt-3.5-turbo",
  temperature: 0.8
});

// Ruta estática para servir archivos HTML
app.use(express.static(path.join(__dirname, 'public')));

// Ruta GET para servir un archivo HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/ask', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "No question provided" });
    }

    const input = await prompt.format({ question });
    const response = await model.invoke(input);
    const parsedResponse = await parser.parse(response);

    res.json({ answer: parsedResponse.answer });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
