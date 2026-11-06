
# Команды

```bash команды для запуска
docker compose up -d       # --- Postgres и RabbitMQ
npm run migration:run
npm run start:dev
npm run produce           
npm run lint
```

# Структура проекта

```
src/config/        переменные окружения и курсы валют
src/database/      сущности, миграции, DataSource для CLI
src/scoring/       расчёт очков и работа с БД
src/messaging/     подключение к RabbitMQ и консьюмер
src/leaderboard/   запрос и HTTP-эндпоинт
scripts/           продюсер для проверки


если хотите посмотреть на заполненный лидерборд -> npm run produce -- --bets 2000 --players 200

```
1) Деньги нигде не превращаются в number. Только строки и decimal.js.
2) Повторная обработка события не меняет результат. Ключи bets.bet_id иусловие status = settled при откате.
3) Откат списывает очки из строки ставки, а не пересчитывает по текущему курсу.
4) Очкименяются одним атомарным запросом, без чтения перед записью.
5) Схема живёт в миграциях, synchronize всегда false.
6) Сообщение либо подтверждается, либо уходит в DLQ. 

