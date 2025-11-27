# untils/__init__.py

from .colormap_utils import COLOR_MAP
from .logger_utils import setup_logging
from .helper_utils import remove_html_tags, remove_useless_value, is_valid_url, convert_relativepath_to_abspath
from .css_parse_utils import read_css_to_json, read_css_to_json_object, SimpleCSSParser

__all__ = [
  'COLOR_MAP',
  'setup_logging'
  'remove_html_tags',
  'remove_useless_value',
  'is_valid_url',
  'convert_relativepath_to_abspath',
  'read_css_to_json',
  'read_css_to_json_object',
  'SimpleCSSParser',
]
