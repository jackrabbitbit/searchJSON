from flask import Flask, render_template, request, jsonify
import json
import re

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

@app.route('/format_json', methods=['POST'])
def format_json():
    try:
        data = request.json['data']
        formatted_json = json.dumps(json.loads(data), indent=2)
        return jsonify({'formatted': formatted_json})
    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid JSON'}), 400

@app.route('/search_json', methods=['POST'])
def search_json():
    data = request.json['data']
    search_term = request.json['search_term'].lower()

    def search_with_path(obj, term, path=None):
        results = []
        matches = []

        if path is None:
            path = []

        if isinstance(obj, dict):
            for key, value in obj.items():
                new_path =  path + [f"'{key}'"]
                if term in key.lower():
                    results.append({'path': '->'.join(new_path)})
                    matches.append({'value': key})
                if isinstance(value, (dict, list)):
                    sub_results, sub_matches = search_with_path(value, term, new_path)
                    results.extend(sub_results)
                    matches.extend(sub_matches)
                elif term in str(value).lower():
                    results.append({'path': '->'.join(new_path)})
                    matches.append({'value': str(value)})
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                new_path = path + [str(i)]
                if isinstance(item, (dict, list)):
                    sub_results, sub_matches = search_with_path(item, term, new_path)
                    results.extend(sub_results)
                    matches.extend(sub_matches)
                elif term in str(item).lower():
                    results.append({'path': '->'.join(new_path)})
                    matches.append({'value': str(item)})
        return results, matches

    try:
        json_data = json.loads(data)
        search_results, matches = search_with_path(json_data, search_term)
        return jsonify({'results': search_results, 'matches': matches})
    except json.JSONDecodeError as e:
        return jsonify({'error': 'Invalid JSON'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)