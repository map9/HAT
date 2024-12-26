from setuptools import setup, find_packages

setup(
    name='eventman',
    version='0.1',
    packages=find_packages(),
    install_requires=[
        "ollama>=0.3.0"
    ],
    extras_require={
        'dev': [
        ]
    },

    author='Map9',
    author_email='map9@yeah.com',
    description='eventman is a tools for event/s ETL, Add, Delete, Edit...',
    url='https://github.com/map9/HAT'
)