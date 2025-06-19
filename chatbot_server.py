# chatbot_server.py
from flask import Flask, request, jsonify, render_template_string,send_from_directory
import random

app = Flask(__name__)

faq = {
    "what is arbitrage": "Arbitrage is the practice of taking advantage of a price difference between two or more markets to make a profit.",
    "how does currency arbitrage work": "Currency arbitrage involves simultaneously buying and selling currency pairs in different markets to profit from differing exchange rates.",
    "which currencies are supported": "Currently, we support USD, EUR, GBP, INR, JPY, and AUD.",
    "how often is data updated": "Our currency exchange data is updated every 5 seconds to ensure accuracy.",
    "is this platform real-time": "Yes, our system fetches exchange rates in near real-time from multiple sources.",
    "what are the requirements to run this site": "You just need a modern browser and a stable internet connection. No installations required on the client side.",
    "is this tool accurate": "We strive for high accuracy, but final exchange values may differ slightly depending on latency and source APIs.",
    "how can i use this site to profit": "You can monitor for arbitrage opportunities and manually perform the trades on supported exchanges or platforms.",
    "does this platform execute trades": "No, we only detect arbitrage opportunities. Execution must be done manually on your chosen exchange.",
    "how is profit calculated": "Profit is calculated based on the price difference between buying and selling rates minus any transaction fees.",
    "can this be used on mobile": "Yes, the site is responsive and works on most mobile browsers.",
    "is my data secure": "We do not store personal or financial data. The tool runs locally in your browser and fetches data from public APIs.",
    "is this connected to live exchanges": "No, this is a simulation based on real-time or test data from exchange APIs.",
    "why is there no arbitrage opportunity sometimes": "Arbitrage relies on market inefficiencies, which may not always exist. When markets align closely, no opportunity appears.",
    "can i contribute to this project": "Yes, the project is open-source. Feel free to fork it or suggest improvements via GitHub (or wherever you host it)."
}


html_template = '''
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>FAQ Chatbot</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0f0f0f;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #fff;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      padding: 40px;
    }

    #chat {
      width: 100%;
      max-width: 700px;
      background: #1e1e1e;
      padding: 30px;
      border-radius: 16px;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
    }

    h2 {
      margin-top: 0;
      font-size: 28px;
      color: #00ffd5;
      text-align: center;
      margin-bottom: 20px;
    }

    #chatlog {
      max-height: 500px;
      overflow-y: auto;
      margin-bottom: 20px;
    }

    .bubble {
      padding: 12px 16px;
      border-radius: 12px;
      margin: 6px 0;
      max-width: 90%;
      line-height: 1.5;
    }

    .user {
      background-color: #00ffd5;
      color: #000;
      align-self: flex-end;
      text-align: right;
      margin-left: auto;
    }

    .bot {
      background-color: #2a2a2a;
      color: #fff;
      align-self: flex-start;
    }

    input[type="text"] {
      width: 70%;
      padding: 12px;
      font-size: 16px;
      border-radius: 8px;
      border: none;
      margin-right: 10px;
      outline: none;
      background-color: #333;
      color: white;
    }

    button {
      padding: 12px 20px;
      font-size: 16px;
      background-color: #00ffd5;
      color: #000;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    button:hover {
      background-color: #00c9a7;
    }

    ul.suggestions {
      list-style: none;
      padding-left: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    ul.suggestions li {
      background-color: #444;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.3s;
      font-size: 14px;
    }

    ul.suggestions li:hover {
      background-color: #00ffd5;
      color: #000;
    }
  </style>
</head>
<body>
  <div id="chat">
    <h2>FAQ Chatbot</h2>
    <div id="chatlog"></div>
    <div style="display: flex; flex-wrap: wrap;">
      <input type="text" id="userInput" placeholder="Ask something..." />
      <button onclick="send()">Send</button>
    </div>
  </div>

  <script>
    function send() {
      const input = document.getElementById('userInput').value.trim();
      if (input === "") return;

      addMessage("You", input, "user");

      fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input })
      })
        .then(res => res.json())
        .then(data => {
          addMessage("Bot", data.answer, "bot");

          if (data.suggestions && data.suggestions.length > 0) {
            showSuggestions(data.suggestions);
          }
        });

      document.getElementById('userInput').value = "";
    }

    function addMessage(sender, message, type) {
      const chatlog = document.getElementById('chatlog');
      const div = document.createElement('div');
      div.className = `bubble ${type}`;
      div.innerHTML = `<b>${sender}:</b> ${message}`;
      chatlog.appendChild(div);
      chatlog.scrollTop = chatlog.scrollHeight;
    }

    function showSuggestions(suggestions) {
      const chatlog = document.getElementById('chatlog');
      const ul = document.createElement('ul');
      ul.className = "suggestions";
      suggestions.forEach(q => {
        const li = document.createElement('li');
        li.innerText = q;
        li.onclick = () => {
          document.getElementById('userInput').value = q;
        };
        ul.appendChild(li);
      });
      chatlog.appendChild(ul);
      chatlog.scrollTop = chatlog.scrollHeight;
    }

    // Show random FAQ suggestions on load
    window.onload = () => {
      fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: '' })
      })
        .then(res => res.json())
        .then(data => {
          if (data.suggestions && data.suggestions.length > 0) {
            addMessage("Bot", "Welcome! Try asking one of these:", "bot");
            showSuggestions(data.suggestions);
          }
        });
    }
  </script>
</body>
</html>

'''

@app.route('/chatbot')
def chatbot_page():
    return render_template_string(html_template)



@app.route('/')
def home():
    return render_template_string(html_template)

@app.route('/ask', methods=['POST'])
def ask():
    question = request.json.get('question', '').lower()
    for key in faq:
        if key in question:
            return jsonify(answer=faq[key], suggestions=[])
    # If not found, suggest FAQs
    return jsonify(
        answer="Sorry, I don't know that. You can try asking one of these:",
        suggestions=get_suggestions()
    )


def get_suggestions(n=5):
    return random.sample(list(faq.keys()), k=min(n, len(faq)))




if __name__ == '__main__':
    app.run(port=5000)
