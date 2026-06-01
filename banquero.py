"""
Algoritmo del Banquero - Evitación de Interbloqueos
Curso: EIF-212 Sistemas Operativos
Implementación con un solo tipo de recurso.
"""


def ejecutar_algoritmo_banquero(num_procesos, num_instancias, asignado, maximo):
    """
    Ejecuta el algoritmo de seguridad del banquero para un solo recurso.

    Retorna un diccionario listo para convertir a JSON y visualizar en la web.
    """
    if len(asignado) != num_procesos or len(maximo) != num_procesos:
        raise ValueError("Las listas asignado/maximo deben tener num_procesos elementos.")

    if num_procesos < 1:
        raise ValueError("Debe existir al menos un proceso.")

    if num_instancias < 1:
        raise ValueError("Debe existir al menos una instancia del recurso.")

    for i in range(num_procesos):
        if asignado[i] < 0 or maximo[i] < 0:
            raise ValueError(f"P{i} no puede tener valores negativos.")
        if asignado[i] > maximo[i]:
            raise ValueError(
                f"El proceso P{i} tiene asignado ({asignado[i]}) > máximo ({maximo[i]})."
            )

    disponible = num_instancias - sum(asignado)
    if disponible < 0:
        raise ValueError("La suma de instancias asignadas supera el total de instancias del sistema.")

    necesita = [maximo[i] - asignado[i] for i in range(num_procesos)]
    pasos = [
        {
            "tipo": "inicio",
            "mensaje": f"Estado inicial — Instancias totales: {num_instancias} | Disponible: {disponible}",
            "disponible": disponible,
            "asignado": list(asignado),
            "maximo": list(maximo),
            "necesita": list(necesita),
        }
    ]

    terminado = [False] * num_procesos
    secuencia = []
    trabajo = disponible
    iteracion = 0

    while len(secuencia) < num_procesos:
        progreso = False
        iteracion += 1

        for i in range(num_procesos):
            if not terminado[i]:
                puede = necesita[i] <= trabajo
                pasos.append(
                    {
                        "tipo": "evaluacion",
                        "iteracion": iteracion,
                        "proceso": i,
                        "necesita_i": necesita[i],
                        "trabajo": trabajo,
                        "puede": puede,
                        "terminado": list(terminado),
                    }
                )

                if puede:
                    trabajo += asignado[i]
                    terminado[i] = True
                    secuencia.append(i)
                    progreso = True
                    pasos.append(
                        {
                            "tipo": "completado",
                            "proceso": i,
                            "trabajo_nuevo": trabajo,
                            "secuencia_actual": list(secuencia),
                            "mensaje": f"P{i} finaliza → libera {asignado[i]} instancia(s). Trabajo disponible: {trabajo}",
                        }
                    )
                    break

        if not progreso:
            bloqueados = [i for i in range(num_procesos) if not terminado[i]]
            pasos.append(
                {
                    "tipo": "interbloqueo",
                    "bloqueados": bloqueados,
                    "trabajo": trabajo,
                    "mensaje": f"No hay proceso que pueda continuar con trabajo={trabajo}. Procesos bloqueados: {[f'P{b}' for b in bloqueados]}",
                }
            )
            break

    seguro = len(secuencia) == num_procesos
    pasos.append(
        {
            "tipo": "resultado",
            "seguro": seguro,
            "secuencia": secuencia,
            "mensaje": (
                f"Estado SEGURO ✓ — Secuencia: {' → '.join([f'P{p}' for p in secuencia])}"
                if seguro
                else "Estado INSEGURO ✗ — El sistema puede caer en interbloqueo."
            ),
        }
    )

    return {
        "seguro": seguro,
        "secuencia": secuencia,
        "pasos": pasos,
        "disponible_inicial": disponible,
        "necesita": necesita,
        "num_procesos": num_procesos,
        "num_instancias": num_instancias,
        "asignado": list(asignado),
        "maximo": list(maximo),
    }


EJEMPLOS = {
    "clasico": {
        "nombre": "Ejemplo clásico",
        "descripcion": "Sistema con 12 instancias y 5 procesos. Estado seguro.",
        "num_procesos": 5,
        "num_instancias": 12,
        "asignado": [2, 3, 2, 1, 0],
        "maximo": [9, 3, 9, 2, 2],
    },
    "simple": {
        "nombre": "Ejemplo simple",
        "descripcion": "Caso básico educativo con 3 procesos y 10 instancias.",
        "num_procesos": 3,
        "num_instancias": 10,
        "asignado": [2, 3, 2],
        "maximo": [9, 5, 7],
    },
    "inseguro": {
        "nombre": "Estado inseguro",
        "descripcion": "No existe una secuencia segura para completar todos los procesos.",
        "num_procesos": 4,
        "num_instancias": 10,
        "asignado": [3, 2, 3, 1],
        "maximo": [9, 8, 7, 4],
    },
}


if __name__ == "__main__":
    for clave, ej in EJEMPLOS.items():
        res = ejecutar_algoritmo_banquero(ej["num_procesos"], ej["num_instancias"], ej["asignado"], ej["maximo"])
        print(f"{clave}: seguro={res['seguro']} | secuencia={res['secuencia']}")
