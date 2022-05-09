#!python3

from asyncio import (
    get_event_loop,
    sleep,
)

from datetime import datetime
import os
from typing import Dict, List, Tuple

from aiohttp import (
    ClientSession,
)

VK_APP_ID = 0
VK_API_URL = 'https://api.vk.com/method/{method}'
VK_OWNER_ID = -0
access_token = ''

date_start = datetime(
    year=2020, month=2, day=23,
    hour=0, minute=0, second=0,
)
date_end = datetime(
    year=2020, month=3, day=8,
    hour=23, minute=59, second=59,
)


async def authorize(session):
    """authorize method"""
    
    url = 'https://oauth.vk.com/authorize'
    params=dict(
        client_id=VK_APP_ID,
        redirect_uri='https://oauth.vk.com/blank.html',
        display='mobile',
        response_type='token',
        revoke=1,
    )
    # 'https://oauth.vk.com/authorize?client_id=0&redirect_uri=https://oauth.vk.com/blank.html&display=mobile&response_type=token'
    # 'https://oauth.vk.com/blank.html#
    # access_token = ''
    # &expires_in=86400&user_id=0'
    
    # https://oauth.vk.com/blank.html#
    # access_token=0
    # &expires_in=86400&user_id=0
    async with session.get(url, params=params) as response:
        token = await response.text()
    print(token)


class TempException(Exception):
    pass


async def save_photo(
        session: ClientSession,
        dt: datetime,
        size: Dict,
        count: int,
):
    """
    Path format:
    /img/
      week_1/ - week number
        day_1/ - day in week
          h0.jpg - hour in day. It's a file
          ...
          h23.jpg - last hour in day
        ...
        day_7/ - last day in week
      ...

    number of week not from calendar, it just order number
    """
    async with session.get(size['url']) as photo_file:
        photo_bin = await photo_file.read()

        week, day, hour = get_week_day_hour_by_count(count)
        save_path = os.path.join(
            '..',
            'img',
            f'week_{week}',
            f'day_{day}',
        )
        if not os.path.exists(save_path):
            os.makedirs(save_path)
        dt = dt.strftime("%Y-%m-%d_%H:%M")
        with open(os.path.join(save_path, f'h{hour}.jpg'), 'wb') as fd:
            fd.write(photo_bin)
        
        with open(os.path.join(save_path, 'info.txt'), 'a') as info_d:
            info_d.write(f'h{hour} {dt}\n')


def get_week_day_hour_by_count(count: int) -> Tuple[int, int, int]:
    """
    >>> get_week_day_hour_by_count(1)
    (1, 1, 0)
    >>> get_week_day_hour_by_count(2)
    (1, 1, 1)
    >>> get_week_day_hour_by_count(23)
    (1, 1, 22)
    >>> get_week_day_hour_by_count(24)
    (1, 1, 23)
    >>> get_week_day_hour_by_count(25)
    (1, 2, 0)
    >>> get_week_day_hour_by_count(48)
    (1, 2, 23)
    >>> get_week_day_hour_by_count(49)
    (1, 3, 0)
    >>> get_week_day_hour_by_count(24*6)
    (1, 6, 23)
    >>> get_week_day_hour_by_count(24*6+1)
    (1, 7, 0)
    >>> get_week_day_hour_by_count(24*7+1)
    (2, 1, 0)
    >>> get_week_day_hour_by_count(24*7+2)
    (2, 1, 1)
    >>> get_week_day_hour_by_count(17*24*7+5)
    (18, 1, 4)
    """
    week = (count-1) // (7*24) + 1
    day = ((count-1) // 24) % 7 + 1
    hour = (count-1) % 24
    return (week, day, hour)


async def wall_get(session: ClientSession) -> None:
    """
    """
    url = VK_API_URL.format(method='wall.get')
    dt = None
    if not getattr(wall_get, 'offset', None):
        wall_get.offset = 5_700
    count = 10
    params = {
        'access_token': access_token,
        'v': '5.131',
        'owner_id': VK_OWNER_ID,
        'offset': wall_get.offset,
        'count': count,
    }
    if not getattr(wall_get, 'inner_count', None):
        wall_get.inner_count = 0

    wall_get.offset -= count
    async with session.get(url, params=params) as response:
        dt = await process_wall_responce(session, response)

    return dt


async def process_wall_responce(session, response) -> datetime:
    try: 
        res_json = await response.json()
    except (ValueError, TypeError) as ex:
        raise TempException(str(ex))
    
    error = res_json.get('error')
    if error:
        raise TempException(error.get('error_msg'))
    wall_items: List = res_json['response']['items']
    
    get_area = lambda s: s['width']*s['height']
    
    for wall_item in wall_items[::-1]:
        dt = datetime.fromtimestamp(wall_item['date']) 
        if not date_start < dt < date_end:
            continue
        try: 
            photo_item = next(filter(
                lambda a: a['type']=='photo',
                wall_item['attachments'],
            ), None)['photo']
        except (KeyError, IndexError):
            continue
        wall_get.inner_count += 1

        max_size = photo_item['sizes'][0]
        for size in photo_item['sizes']:
            # FIXME min -> max
            max_size = max(size, max_size, key=get_area)

        await save_photo(
            session=session,
            dt=dt,
            size=max_size,
            count=wall_get.inner_count,
        )
    return dt


async def photos_get(session: ClientSession) -> None:
    """
    """
    url = VK_API_URL.format(method='photos.get')
    dt = None
    if not getattr(photos_get, 'offset', None):
        photos_get.offset = 9_700
    count = 10
    params = {
        'access_token': access_token,
        'v': '5.131',
        'owner_id': -184860963,
        'album_id': 'wall',
        'photo_ids': ','.join(()),
        'rev': 0,
        'offset': photos_get.offset,
        'count': count,
    }
    if not getattr(photos_get, 'inner_count', None):
        photos_get.inner_count = 0

    photos_get.offset += count
    async with session.get(url, params=params) as response:
        try: 
            res_json = await response.json()
        except (ValueError, TypeError) as ex:
            raise TempException(str(ex))
        
        error = res_json.get('error')
        if error:
            raise TempException(error.get('error_msg'))
        photo_items = res_json['response']['items']
        
        get_area = lambda s: s['width']*s['height']
        
        for photo_item in photo_items:
            dt = datetime.fromtimestamp(photo_item['date'])
            if not date_start < dt < date_end:
                continue
            
            photos_get.inner_count += 1

            max_size = photo_item['sizes'][0]
            for size in photo_item['sizes']:
                # FIXME min -> max
                max_size = max(size, max_size, key=get_area)

            await save_photo(
                session=session,
                dt=dt,
                size=max_size,
                count=photos_get.inner_count,
            )
    return dt


async def main() -> None:
    """
    """
    async with ClientSession() as session:
        for _ in range(1000):
            try:
                last_dt = await wall_get(session)
            except TempException as te:
                print(str(te))

            if last_dt > date_end:
                print('Dowload stoped. Period done!')
                break
            await sleep(0.5)
        else:
            print('Dowload stoped. Limit iterations')


if __name__=="__main__":
    loop = get_event_loop()
    t1 = datetime.now()
    loop.run_until_complete(main())
    t2 = datetime.now() - t1
    print(f'Еlapsed time : {t2}')
