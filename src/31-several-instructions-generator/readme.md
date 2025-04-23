# Several Instructions Generator

This project explores the capability of Large Language Models (LLMs) to reproduce patterns based on provided examples.

The core idea is to train the LLM by showing it pairs of problems and their corresponding solutions (in this case, instructions and C# script snippets). The expectation is that the LLM will learn the underlying structure and logic to generate similar solutions for new, unseen problems.

During this experiment, we encountered limitations when dealing with more complex tasks such as generating instructions and C# code for handling **Table of Contents** and **Styles**. Since our initial training data only covered a limited set of problems and did not include specific examples demonstrating how to handle these particular features, the LLM was unable to produce accurate or detailed outputs for them.

This highlights that while LLMs are powerful pattern-matching engines, their performance is heavily dependent on the diversity and completeness of the training data. To enable the LLM to successfully generate solutions for tasks like Table of Contents and Style handling, we would need to:

1.  Manually create examples demonstrating the desired instructions and C# script implementation for these features.
2.  Include these new examples in the system prompt.

By providing more comprehensive and specific examples, we can significantly improve the LLM's ability to reproduce the required patterns for a wider range of tasks.    