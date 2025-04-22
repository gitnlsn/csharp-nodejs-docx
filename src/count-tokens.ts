import { encoding_for_model, TiktokenModel } from "@dqbd/tiktoken";

interface CountTokensProps {
    text: string;
    model?: TiktokenModel;
}

export const countTokens = (props: CountTokensProps) => {
    const { text, model } = props;
    const encoding = encoding_for_model(model ?? 'gpt-4o-mini');
    const tokens = encoding.encode(text);
    return tokens.length;
}