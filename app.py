import os
import random
import gradio as gr

def new_game():
    return random.randint(1, 100), "1부터 100 사이 숫자를 맞혀보세요!"

def check_guess(guess, answer):
    if guess is None:
        return "숫자를 입력하세요.", answer
    try:
        guess = int(guess)
    except (TypeError, ValueError):
        return "정수를 입력하세요.", answer
    if guess < 1 or guess > 100:
        return "1~100 사이 숫자를 입력하세요.", answer
    if guess < answer:
        return f"{guess}보다 큽니다!", answer
    if guess > answer:
        return f"{guess}보다 작습니다!", answer
    return f"정답! {answer}였습니다. 새 게임을 시작합니다.", random.randint(1, 100)

with gr.Blocks(title="Python 숫자 맞히기 게임") as demo:
    gr.Markdown("# Python 숫자 맞히기 게임")
    gr.Markdown("Render에 배포한 Python + Gradio 테스트 게임")
    answer = gr.State()
    guess = gr.Number(label="숫자 입력", minimum=1, maximum=100, precision=0)
    status = gr.Markdown()
    with gr.Row():
        submit = gr.Button("정답 확인", variant="primary")
        reset = gr.Button("새 게임")
    submit.click(check_guess, inputs=[guess, answer], outputs=[status, answer])
    reset.click(new_game, outputs=[answer, status])
    demo.load(new_game, outputs=[answer, status])

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "7860"))
    demo.launch(server_name="0.0.0.0", server_port=port)
