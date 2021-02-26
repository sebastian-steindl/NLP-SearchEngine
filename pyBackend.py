import flask
from flask_cors import CORS
from flask import request, jsonify
from spacy import displacy
import spacy
from gensim.models import Word2Vec
from numpy import exp, dot
from gensim import matutils
# load the spacy model
nlp = spacy.load('de_core_news_lg')
app = flask.Flask(__name__)
app.config["DEBUG"] = True
CORS(app)
pathToModel = "./word_embeddings/"
model = Word2Vec.load(pathToModel+"withStopwords_w2v.model")

"""
Sagt die topn Wörter vorher für das center_word
"""
def predict_output_context(model, center_word, topn=10):
    word = model.wv.vocab[center_word.lower()]
    vec = model.wv.vectors[word.index]
    prob_values = exp(dot(vec, model.trainables.syn1neg.T))
    prob_values /= sum(prob_values)
    top_indices = matutils.argsort(prob_values, topn=topn, reverse=True)
    return [(model.wv.index2word[index1], prob_values[index1]) for index1 in top_indices]

"""
Sanity-Check um zu schauen ob das Backend läuft
"""
@app.route("/", methods=["GET"])
def basicGet():
    return "Get received"


"""
Parsed einen Satz mit Spacy (POS) und gibt die gleiche Struktur zurück, die sonst verwendet wird. Der Satz wird im form-Parameter 'sentence' erwartet.
"""
@app.route("/parse", methods=["POST"])
def parseSentence():
    global nlp
    sentence = request.form.get("sentence")
    print("sentence: ", sentence)
    doc = nlp(sentence)
    Worddict = {"ROOT": [], "Subjekt": [],
                "AkkusativObjekt": [], "DativObjekt": [], "Rest": []}
    for token in doc:
        if token.dep_ == "ROOT":
            Worddict["ROOT"].append(token.text)
        elif token.dep_ == "sb":
            Worddict["Subjekt"].append(token.text)
        elif token.dep_ == "oa":
            Worddict["AkkusativObjekt"].append(token.text)
        elif token.dep_ == "da":
            Worddict["DativObjekt"].append(token.text)
        else:
            Worddict["Rest"].append(token.text)

    return jsonify(Worddict)

"""
Rendered einen Satz und gibt das SVG zurück. Der Satz wird im form-Parameter 'sentence' erwartet.
"""
@app.route("/render", methods=["POST"])
def renderSentence():
    global nlp
    sentence = request.form.get("sentence")
    print("sentence:", sentence)
    svg = displacy.render(nlp(sentence), style="dep")
    return jsonify(svg)


"""
Predicted die umgebenden Wörter für einen Input mit dem w2v model und gibt diese zurück. Der Input wird im form-Parameter 'input' erwartet.
"""
@app.route("/predict", methods=["POST"])
def predictSurroundingsSentence():
    global nlp
    global model
    inp = request.form.get("input")
    print("input:", inp)
    predictions = predict_output_context(model=model, center_word=inp, topn=10)
    words = [i[0] for i in predictions]
    print("prediction", words, predictions)
    return jsonify(words)

# Flask server starten
app.run()
