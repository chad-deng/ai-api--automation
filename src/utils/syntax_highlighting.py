"""
Syntax Highlighting Utilities
Provides code syntax highlighting using Pygments for QA Review interface
"""
import re
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import structlog

from pygments import highlight
from pygments.lexers import get_lexer_by_name, guess_lexer_for_filename
from pygments.formatters import HtmlFormatter
from pygments.util import ClassNotFound

logger = structlog.get_logger()

class SyntaxHighlighter:
    """Handles syntax highlighting for various file types"""
    
    def __init__(self, style: str = "github-dark", line_numbers: bool = True):
        self.style = style
        self.line_numbers = line_numbers
        self.formatter = HtmlFormatter(
            style=self.style,
            linenos=self.line_numbers,
            cssclass="highlight",
            linespans="line",
            anchorlinenos=True,
            lineanchors="L"
        )
        
    def highlight_code(self, content: str, file_path: Optional[str] = None, 
                      language: Optional[str] = None) -> Dict[str, str]:
        """
        Highlight code content with syntax coloring
        
        Args:
            content: Code content to highlight
            file_path: Optional file path to determine lexer
            language: Optional language name to force lexer
            
        Returns:
            Dict with highlighted HTML and CSS
        """
        try:
            # Determine lexer
            lexer = self._get_lexer(content, file_path, language)
            
            # Generate highlighted HTML
            highlighted_html = highlight(content, lexer, self.formatter)
            
            # Generate CSS for the highlighting
            css = self.formatter.get_style_defs('.highlight')
            
            return {
                "html": highlighted_html,
                "css": css,
                "language": lexer.name,
                "file_extension": Path(file_path).suffix if file_path else None
            }
            
        except Exception as e:
            logger.warning("Failed to highlight code", error=str(e), file_path=file_path)
            
            # Fallback to plain text with line numbers
            lines = content.split('\n')
            html_lines = []
            for i, line in enumerate(lines, 1):
                html_lines.append(
                    f'<span class="line" id="L{i}"><span class="lineno">{i}</span>'
                    f'<span class="code">{self._escape_html(line)}</span></span>'
                )
            
            fallback_html = f'<div class="highlight fallback"><pre>{"".join(html_lines)}</pre></div>'
            fallback_css = self._get_fallback_css()
            
            return {
                "html": fallback_html,
                "css": fallback_css,
                "language": "text",
                "file_extension": Path(file_path).suffix if file_path else None
            }
    
    def highlight_diff(self, old_content: str, new_content: str, 
                      file_path: Optional[str] = None) -> Dict[str, str]:
        """
        Highlight code differences between two versions
        
        Args:
            old_content: Original code content
            new_content: Modified code content
            file_path: Optional file path to determine lexer
            
        Returns:
            Dict with diff HTML and CSS
        """
        try:
            import difflib
            
            # Generate unified diff
            diff_lines = list(difflib.unified_diff(
                old_content.splitlines(keepends=True),
                new_content.splitlines(keepends=True),
                fromfile=f"a/{file_path}" if file_path else "a/file",
                tofile=f"b/{file_path}" if file_path else "b/file",
                n=3
            ))
            
            diff_content = ''.join(diff_lines)
            
            # Highlight as diff
            from pygments.lexers import DiffLexer
            diff_lexer = DiffLexer()
            
            highlighted_html = highlight(diff_content, diff_lexer, self.formatter)
            css = self.formatter.get_style_defs('.highlight')
            
            return {
                "html": highlighted_html,
                "css": css,
                "language": "diff",
                "file_extension": Path(file_path).suffix if file_path else None
            }
            
        except Exception as e:
            logger.error("Failed to highlight diff", error=str(e))
            return self._fallback_diff_view(old_content, new_content)
    
    def highlight_side_by_side(self, old_content: str, new_content: str,
                             file_path: Optional[str] = None) -> Dict[str, str]:
        """
        Create side-by-side diff view with syntax highlighting
        
        Args:
            old_content: Original code content  
            new_content: Modified code content
            file_path: Optional file path to determine lexer
            
        Returns:
            Dict with side-by-side HTML and CSS
        """
        try:
            import difflib
            
            old_lines = old_content.splitlines()
            new_lines = new_content.splitlines()
            
            # Create diff object
            differ = difflib.SequenceMatcher(None, old_lines, new_lines)
            
            html_left = []  # Old content
            html_right = []  # New content
            
            old_line_num = 1
            new_line_num = 1
            
            for tag, i1, i2, j1, j2 in differ.get_opcodes():
                if tag == 'equal':
                    # Lines are identical
                    for i, line in enumerate(old_lines[i1:i2]):
                        highlighted_line = self._highlight_line(line, file_path)
                        html_left.append(self._format_diff_line(
                            old_line_num + i, highlighted_line, 'equal'
                        ))
                        html_right.append(self._format_diff_line(
                            new_line_num + i, highlighted_line, 'equal'
                        ))
                    old_line_num += (i2 - i1)
                    new_line_num += (j2 - j1)
                    
                elif tag == 'delete':
                    # Lines deleted from old
                    for i, line in enumerate(old_lines[i1:i2]):
                        highlighted_line = self._highlight_line(line, file_path)
                        html_left.append(self._format_diff_line(
                            old_line_num + i, highlighted_line, 'delete'
                        ))
                    html_right.extend(['<div class="diff-line empty"></div>'] * (i2 - i1))
                    old_line_num += (i2 - i1)
                    
                elif tag == 'insert':
                    # Lines inserted in new
                    for i, line in enumerate(new_lines[j1:j2]):
                        highlighted_line = self._highlight_line(line, file_path)
                        html_right.append(self._format_diff_line(
                            new_line_num + i, highlighted_line, 'insert'
                        ))
                    html_left.extend(['<div class="diff-line empty"></div>'] * (j2 - j1))
                    new_line_num += (j2 - j1)
                    
                elif tag == 'replace':
                    # Lines changed
                    old_count = i2 - i1
                    new_count = j2 - j1
                    max_count = max(old_count, new_count)
                    
                    for i in range(max_count):
                        if i < old_count:
                            line = old_lines[i1 + i]
                            highlighted_line = self._highlight_line(line, file_path)
                            html_left.append(self._format_diff_line(
                                old_line_num + i, highlighted_line, 'delete'
                            ))
                        else:
                            html_left.append('<div class="diff-line empty"></div>')
                            
                        if i < new_count:
                            line = new_lines[j1 + i]
                            highlighted_line = self._highlight_line(line, file_path)
                            html_right.append(self._format_diff_line(
                                new_line_num + i, highlighted_line, 'insert'
                            ))
                        else:
                            html_right.append('<div class="diff-line empty"></div>')
                    
                    old_line_num += old_count
                    new_line_num += new_count
            
            # Combine into side-by-side view
            side_by_side_html = f'''
            <div class="diff-side-by-side">
                <div class="diff-left">
                    <div class="diff-header">Original</div>
                    <div class="diff-content">{''.join(html_left)}</div>
                </div>
                <div class="diff-right">
                    <div class="diff-header">Modified</div>
                    <div class="diff-content">{''.join(html_right)}</div>
                </div>
            </div>
            '''
            
            css = self.formatter.get_style_defs('.highlight') + self._get_diff_css()
            
            return {
                "html": side_by_side_html,
                "css": css,
                "language": self._get_language_from_path(file_path),
                "file_extension": Path(file_path).suffix if file_path else None
            }
            
        except Exception as e:
            logger.error("Failed to create side-by-side diff", error=str(e))
            return self._fallback_diff_view(old_content, new_content)
    
    def _get_lexer(self, content: str, file_path: Optional[str] = None,
                   language: Optional[str] = None):
        """Get appropriate Pygments lexer for content"""
        try:
            if language:
                return get_lexer_by_name(language)
            elif file_path:
                return guess_lexer_for_filename(file_path, content)
            else:
                from pygments.lexers import guess_lexer
                return guess_lexer(content)
        except ClassNotFound:
            # Default to Python lexer for test files
            return get_lexer_by_name('python')
    
    def _highlight_line(self, line: str, file_path: Optional[str] = None) -> str:
        """Highlight a single line of code"""
        try:
            lexer = self._get_lexer(line, file_path)
            formatter = HtmlFormatter(nowrap=True, style=self.style)
            return highlight(line, lexer, formatter)
        except Exception:
            return self._escape_html(line)
    
    def _format_diff_line(self, line_num: int, content: str, line_type: str) -> str:
        """Format a line for diff display"""
        css_class = f"diff-line {line_type}"
        return f'<div class="{css_class}"><span class="line-number">{line_num}</span><span class="line-content">{content}</span></div>'
    
    def _escape_html(self, text: str) -> str:
        """Escape HTML characters"""
        return (text.replace('&', '&amp;')
                   .replace('<', '&lt;')
                   .replace('>', '&gt;')
                   .replace('"', '&quot;')
                   .replace("'", '&#x27;'))
    
    def _get_language_from_path(self, file_path: Optional[str]) -> str:
        """Get language name from file path"""
        if not file_path:
            return "text"
        
        ext = Path(file_path).suffix.lower()
        language_map = {
            '.py': 'python',
            '.js': 'javascript', 
            '.ts': 'typescript',
            '.html': 'html',
            '.css': 'css',
            '.json': 'json',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.xml': 'xml',
            '.sql': 'sql',
            '.sh': 'bash',
            '.md': 'markdown'
        }
        
        return language_map.get(ext, 'text')
    
    def _get_fallback_css(self) -> str:
        """CSS for fallback highlighting"""
        return '''
        .highlight.fallback {
            background-color: #f8f8f8;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            overflow-x: auto;
        }
        .highlight.fallback .line {
            display: block;
            min-height: 1.2em;
        }
        .highlight.fallback .lineno {
            display: inline-block;
            width: 3em;
            text-align: right;
            padding-right: 0.5em;
            color: #999;
            user-select: none;
            border-right: 1px solid #e0e0e0;
            margin-right: 0.5em;
        }
        .highlight.fallback .code {
            white-space: pre;
            font-family: 'Monaco', 'Consolas', monospace;
        }
        '''
    
    def _get_diff_css(self) -> str:
        """CSS for diff display"""
        return '''
        .diff-side-by-side {
            display: flex;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
        }
        .diff-left, .diff-right {
            flex: 1;
            min-width: 0;
        }
        .diff-left {
            border-right: 1px solid #e0e0e0;
        }
        .diff-header {
            background-color: #f5f5f5;
            padding: 0.5em 1em;
            font-weight: bold;
            border-bottom: 1px solid #e0e0e0;
        }
        .diff-content {
            max-height: 500px;
            overflow-y: auto;
        }
        .diff-line {
            display: flex;
            min-height: 1.2em;
            line-height: 1.2em;
        }
        .diff-line.equal {
            background-color: transparent;
        }
        .diff-line.delete {
            background-color: #ffecec;
        }
        .diff-line.insert {
            background-color: #eaffea;
        }
        .diff-line.empty {
            background-color: #f8f8f8;
        }
        .line-number {
            display: inline-block;
            width: 3em;
            text-align: right;
            padding: 0 0.5em;
            color: #999;
            user-select: none;
            border-right: 1px solid #e0e0e0;
            background-color: #f8f8f8;
        }
        .line-content {
            flex: 1;
            padding: 0 0.5em;
            white-space: pre;
            font-family: 'Monaco', 'Consolas', monospace;
            overflow-x: auto;
        }
        '''
    
    def _fallback_diff_view(self, old_content: str, new_content: str) -> Dict[str, str]:
        """Fallback diff view when highlighting fails"""
        old_lines = old_content.splitlines()
        new_lines = new_content.splitlines()
        
        html = f'''
        <div class="diff-fallback">
            <div class="diff-section">
                <h4>Original ({len(old_lines)} lines)</h4>
                <pre>{self._escape_html(old_content)}</pre>
            </div>
            <div class="diff-section">
                <h4>Modified ({len(new_lines)} lines)</h4>
                <pre>{self._escape_html(new_content)}</pre>
            </div>
        </div>
        '''
        
        css = '''
        .diff-fallback {
            display: flex;
            gap: 1em;
        }
        .diff-section {
            flex: 1;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
        }
        .diff-section h4 {
            margin: 0;
            padding: 0.5em;
            background-color: #f5f5f5;
            border-bottom: 1px solid #e0e0e0;
        }
        .diff-section pre {
            margin: 0;
            padding: 1em;
            max-height: 400px;
            overflow: auto;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 0.9em;
        }
        '''
        
        return {
            "html": html,
            "css": css,
            "language": "text",
            "file_extension": None
        }

# Global syntax highlighter instance
syntax_highlighter = SyntaxHighlighter()