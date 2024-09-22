from setuptools import setup, find_packages

setup(
    name='docbook',
    version='0.1',
    packages=find_packages(),
    install_requires=[
        "urllib3>=2.2.2"
    ],
    extras_require={
        'dev': [
        ]
    },

    author='Map9',
    author_email='map9@yeah.com',
    description='docbook is a new ancient document file used json, can process comments and notes in ancient document, and search and analysis document content.',
    url='https://github.com/map9/docbook'
)