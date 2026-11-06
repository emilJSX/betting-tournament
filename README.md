





# Запуск

Первый терминал:

```bash
docker compose up -d
```

```bash
cp .env.example .env
npm install
npm run migration:run
npm run start:dev

```

Во втором терминале:

```bash
npm run produce -- --checks          # отправить проверочные события
npm run produce                      # то же плюс 200 случайных ставок
npm run produce -- --bets 2000 --players 200   # нагрузка побольше

curl -s localhost:3000/leaderboard                              # топ-100
curl -s -H 'X-Player-Id: check-usd' localhost:3000/leaderboard  # топ-100 и позиция игрока

docker compose exec postgres psql -U tournament -d tournament \
  -c "select bet_id, player_id, currency, win_amount, points, status from bets order by created_at;"   # журнал ставок

docker compose exec postgres psql -U tournament -d tournament \
  -c "select * from player_scores order by points desc;"        # текущие очки игроков
```

# ОЧЕНЬ ВАЖНО!
По адресу localhost:3000 браузер
покажет {"message":"Cannot GET /","statusCode":404} — это нормально,
корневого маршрута нет, нужен localhost:3000/leaderboard. И в браузере не
поставить заголовок X-Player-Id, поэтому player там всегда будет null;
для проверки позиции используйте curl.


# Логин в RabbitMQ
```
http://localhost:15672/

логин и пароль: tournament
```

# Проверка

```bash
npm run produce -- --checks
```
Скрипт публикует шесть показательных событий и печатает, что должно
получиться. Через пару секунд:

```bash
curl -s localhost:3000/leaderboard
```

Ожидаемый результат:

 игрок | очки | почему |
 check-eur | 109 | 100 EUR по курсу 1.09 |
 check-duplicate | 70 | bet.settled пришёл дважды, очки начислены один раз |
 check-usd | 25.5 | выиграно 25.50 USD |
 check-rollback | 0 | ставка рассчитана на 500 и отменена |
 check-loss | нет строки | проигрыш, очки не начисляются |
 check-unknown-currency | нет строки | нет курса для валюты, сообщение ушло в DLQ |

Позиция конкретного игрока приходит только с заголовком:

```bash
curl -s -H 'X-Player-Id: check-usd' localhost:3000/leaderboard
```

Побольше данных, если хочется посмотреть на заполненный лидерборд:

```bash
npm run produce -- --bets 2000 --players 200
```

Без флага --checks скрипт сначала отправляет те же шесть проверочных
событий, а потом 200 случайных ставок.

# Эндпоинт

GET /leaderboard отдаёт топ-100. Если передать заголовокX-Player-Id, в
ответе будет ещё и позиция этого игрока, даже когда он не попал в сотню.

```json
{
  "top": [{ "rank": 1, "playerId": "player-012", "points": "2379.2053" }],
  "player": { "playerId": "player-045", "points": "218", "rank": 145 }
}
```

Очки отдаю строкой, а не числом, чтобы не терять точность на больших суммах.
При равенстве очков места делятся: 1, 1, 3.

# События

Публикуются в topic-exchange bets.

```
bet.settled   { "betId": "b1", "playerId": "p1", "currency": "EUR",
                "stake": 10, "winAmount": 100, "settledAt": "2026-11-06T10:00:00.000Z" }

bet.rollback  { "betId": "b1", "playerId": "p1" }
```

Суммы можно присылать числом или строкой. Если сообщение не удалось
обработать, оно уходит в bets.events.dlq.

# Схема

bets — по строке на рассчитанную ставку, первичный ключ bet_id даёт
идемпотентность. player_scores — текущая сумма очков игрока, чтобы не
агрегировать журнал на каждый запрос. Индекс (points DESC, player_id ASC)
закрывает оба запроса лидерборда.

Посмотреть, что реально записалось:

```bash
docker compose exec postgres psql -U tournament -d tournament \
  -c "select bet_id, player_id, currency, win_amount, points, status from bets order by created_at desc limit 10;" \
  -c "select * from player_scores order by points desc;"
```



