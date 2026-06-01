"""Servidor Flask para la visualización del Algoritmo del Banquero."""

from flask import Flask, jsonify, render_template, request
from banquero import EJEMPLOS, ejecutar_algoritmo_banquero

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html", ejemplos=EJEMPLOS)


@app.route("/api/ejemplos")
def api_ejemplos():
    return jsonify(EJEMPLOS)


@app.route("/api/ejemplo/<clave>")
def api_ejemplo(clave):
    if clave not in EJEMPLOS:
        return jsonify({"error": "Ejemplo no encontrado."}), 404

    ejemplo = EJEMPLOS[clave]
    resultado = ejecutar_algoritmo_banquero(
        ejemplo["num_procesos"],
        ejemplo["num_instancias"],
        ejemplo["asignado"],
        ejemplo["maximo"],
    )
    resultado["info"] = ejemplo
    return jsonify(resultado)


@app.route("/api/ejecutar", methods=["POST"])
def api_ejecutar():
    datos = request.get_json(silent=True) or {}

    try:
        num_procesos = int(datos["num_procesos"])
        num_instancias = int(datos["num_instancias"])
        asignado = [int(valor) for valor in datos["asignado"]]
        maximo = [int(valor) for valor in datos["maximo"]]

        if not 1 <= num_procesos <= 10:
            return jsonify({"error": "El número de procesos debe estar entre 1 y 10."}), 400
        if not 1 <= num_instancias <= 100:
            return jsonify({"error": "Las instancias deben estar entre 1 y 100."}), 400

        resultado = ejecutar_algoritmo_banquero(num_procesos, num_instancias, asignado, maximo)
        return jsonify(resultado)

    except KeyError as error:
        return jsonify({"error": f"Campo requerido faltante: {error}"}), 400
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except Exception as error:
        return jsonify({"error": f"Error interno: {error}"}), 500


if __name__ == "__main__":
    print("\nAlgoritmo del Banquero — EIF-212 Sistemas Operativos")
    print("Abre tu navegador en: http://127.0.0.1:5000\n")
    app.run(debug=True, host="127.0.0.1", port=5000)
