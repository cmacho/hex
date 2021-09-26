FROM python:3.8
WORKDIR /app
COPY . .
RUN pip install django==3.2.7
RUN python3 manage.py makemigrations
RUN python3 manage.py migrate
CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]
