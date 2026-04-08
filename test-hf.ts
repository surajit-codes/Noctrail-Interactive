import { config } from 'dotenv';
config({ path: '.env.local' });
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY!);
async function run() {
  const res = await hf.chatCompletion({
    model: 'meta-llama/Meta-Llama-3-8B-Instruct',
    messages: [{ role: 'system', content: 'Output ONLY valid JSON.' }, { role: 'user', content: 'Give me a dummy large json object with 15 nested fields. Make it at least 800 tokens long.' }],
    max_tokens: 2000
  });
  console.log('Response string length:', res.choices?.[0]?.message?.content?.length);
  const content = res.choices?.[0]?.message?.content || "";
  console.log(content.substring(content.length - 200));
}
run().catch(console.error);
