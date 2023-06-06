from flask import Flask, request
import json
import base64
import sympy
from sympy import factor, expand, apart, expand_trig
import math
from TypstCalculatorServer import TypstCalculatorServer, VERSION

app = Flask(__name__)

server = TypstCalculatorServer()
calc = server.calculator

typst = server.typst
typst2sympy = server.sympy
exec_code = server.exec
subs, simplify, evalf, solve = server.subs, server.simplify, server.evalf, server.solve
set_variance, unset_variance, clear_variance = server.set_variance, server.unset_variance, server.clear_variance
operator, relation_op, additive_op, mp_op, postfix_op, reduce_op, func, func_mat, constant = calc.get_decorators()
var = server.var


def base64_decode(s: str):
    return base64.b64decode(s).decode('utf-8')


@app.route('/')
def main():
    return 'Typst Sympy Calculator Server'


@app.route('/version', methods=['GET'])
def get_version():
    return {
        'data': VERSION,
        'error': ''
    }


@app.route('/init', methods=['POST'])
def post_init():
    try:
        return {
            'data': server.init(base64_decode(request.json['typst_file'])),
            'error': ''
        }
    except Exception as e:
        return {
            'data': '',
            'error': str(e)
        }


@app.route('/simplify', methods=['POST'])
def post_simplify():
    try:
        return {
            'data': typst(simplify(base64_decode(request.json['typst_math']), base64_decode(request.json['typst_file']))),
            'error': ''
        }
    except Exception as e:
        return {
            'data': '',
            'error': str(e)
        }


@app.route('/evalf', methods=['POST'])
def post_evalf():
    try:
        return {
            'data': typst(evalf(base64_decode(request.json['typst_math']), base64_decode(request.json['typst_file']))),
            'error': ''
        }
    except Exception as e:
        return {
            'data': '',
            'error': str(e)
        }


@app.route('/solve', methods=['POST'])
def post_solve():
    try:
        return {
            'data': typst(solve(base64_decode(request.json['typst_math']), base64_decode(request.json['typst_file']))),
            'error': ''
        }
    except Exception as e:
        return {
            'data': '',
            'error': str(e)
        }


@app.route('/factor', methods=['POST'])
def post_factor():
    try:
        return {
            'data': typst(factor(subs(base64_decode(request.json['typst_math']), base64_decode(request.json['typst_file'])))),
            'error': ''
        }
    except Exception as e:
        return {
            'data': '',
            'error': str(e)
        }


@app.route('/expand', methods=['POST'])
def post_expand():
    try:
        return {
            'data': typst(expand(apart(expand_trig(subs(base64_decode(request.json['typst_math']), base64_decode(request.json['typst_file'])))))),
            'error': ''
        }
    except Exception as _:
        try:
            return {
                'data': typst(expand(expand_trig(subs(base64_decode(request.json['typst_math']), base64_decode(request.json['typst_file']))))),
                'error': ''
            }
        except Exception as e:
            return {
                'data': '',
                'error': str(e)
            }


@app.route('/variances', methods=['GET'])
def get_variances():
    try:
        result = {}
        for key in var:
            result[key] = typst(var[key])
        return {
            'data': result,
            'error': ''
        }
    except Exception as e:
        return {
            'data': '',
            'error': str(e)
        }


@app.route('/python', methods=['POST'])
def run_python():
    try:
        rv = None
        try:
            rv = eval(base64_decode(request.json['code']))
        except SyntaxError:
            # replace all \t with 4 spaces
            python_code = base64_decode(request.json['code']).replace('\t', '    ')
            # remove leading indent from python code
            lines = python_code.split('\n')
            indent = len(lines[0]) - len(lines[0].lstrip())
            new_python_code = ''
            for line in lines:
                assert set(' ' + line[:indent]) == set(' '), 'IndentationError'
                new_python_code += line[indent:] + '\n'
            exec(new_python_code)
        return {
            'data': str(rv),
            'error': ''
        }
    except Exception as e:
        return {
            'data': '',
            'error': str(e)
        }


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=7396)
