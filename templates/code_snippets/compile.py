import os
from flask import Flask, render_template
from pygments import highlight
from pygments.lexers import get_lexer_for_filename
from pygments.formatters import HtmlFormatter

app = Flask(__name__)

def code_snippet(snippet_filename, n_start=1, n_end=0):
    # Open the code snippet and trim it to the desired lines
    f = open('templates/code_snippets/' + snippet_filename, 'r')
    lines = f.read().split('\n')
    n_end = len(lines) if n_end == 0 else n_end
    text = '\n'.join(lines[n_start-1:n_end])

    # Produce the highlight-formatted HTML
    hl_fmt = HtmlFormatter(linenos="table", linenostart=n_start)
    highlit_text = highlight(text,
            get_lexer_for_filename(snippet_filename),
            hl_fmt)
    return "<div class='codeholder'>\n" + highlit_text + "\n</div>"

# Add code_snippet() to Jinja2's globals
# so it can be called from templates
app.jinja_env.globals.update(code_snippet=code_snippet)

with app.app_context():
    # Render syntax highlighting template
    f = open("highlighting.css", 'w')
    f.write(HtmlFormatter().get_style_defs('.highlight'))
    f.close()

    # Render individual pages (but not the base template)
    for filename in os.listdir('templates'):
        if '.html' in filename and filename != 'base.html':
            print("Compiling template {}...".format(filename))

            # Link back home (for pages other than index.html)
            link_home = filename != 'index.html'

            rendered_html = render_template(
                    filename, link_home=link_home)
            f = open(filename, 'w')
            f.write(rendered_html)
            f.close()
